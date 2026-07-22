'use client';

import {useEffect, useRef, useState} from 'react'
import {cn, configureAssistant, getSubjectColor} from "@/lib/utils";
import {vapi} from "@/lib/vapi.sdk";
import Image from "next/image";
import Lottie, {LottieRefCurrentProps} from "lottie-react";
import soundwaves from '@/constants/soundwaves.json'
import {addToSessionHistory} from "@/lib/actions/companion.actions";
import { jsPDF } from "jspdf";
import Whiteboard, { WhiteboardItem } from "@/components/Whiteboard";

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
}

const CompanionComponent = ({ companionId, subject, topic, name, userName, userImage, style, voice, duration = 10, userPlan = 'free' }: CompanionComponentProps) => {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [activeTranscript, setActiveTranscript] = useState<SavedMessage | null>(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [whiteboardItems, setWhiteboardItems] = useState<WhiteboardItem[]>([]);

    const lottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if(lottieRef) {
            if(isSpeaking) {
                lottieRef.current?.play()
            } else {
                lottieRef.current?.stop()
            }
        }
    }, [isSpeaking, lottieRef])

    useEffect(() => {
        const storedCooldownTimestamp = localStorage.getItem(`cooldown_expires_${companionId}`);
        if(storedCooldownTimestamp) {
            const expiresAt = parseInt(storedCooldownTimestamp, 10);
            const now = Date.now();
            if (expiresAt > now) {
                setCooldownRemaining(Math.ceil((expiresAt - now) / 1000));
            } else {
                localStorage.removeItem(`cooldown_expires_${companionId}`);
            }
        }
    }, [companionId]);

    useEffect(() => {
        let timerId: NodeJS.Timeout;
        if (callStatus === CallStatus.ACTIVE) {
            timerId = setInterval(() => {
                setTimeElapsed((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [callStatus]);

    useEffect(() => {
        if (callStatus === CallStatus.ACTIVE && timeElapsed >= duration * 60) {
            setCallStatus(CallStatus.FINISHED);
            vapi.stop();
            setTimeElapsed(0);
            
            const expiresAt = Date.now() + 60 * 1000;
            localStorage.setItem(`cooldown_expires_${companionId}`, expiresAt.toString());
            setCooldownRemaining(60);
        }
    }, [timeElapsed, callStatus, duration, companionId]);

    useEffect(() => {
        let cooldownId: NodeJS.Timeout;
        if (cooldownRemaining > 0) {
            cooldownId = setInterval(() => {
                setCooldownRemaining((prev) => {
                    if (prev <= 1) {
                        localStorage.removeItem(`cooldown_expires_${companionId}`);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (cooldownId) clearInterval(cooldownId);
        };
    }, [cooldownRemaining, companionId]);

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);

        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED);
            addToSessionHistory(companionId)
        }

        const onMessage = (message: any) => {
            if(message.type === 'transcript') {
                if (message.transcriptType === 'partial') {
                    setActiveTranscript({ role: message.role, content: message.transcript });
                } else if (message.transcriptType === 'final') {
                    setActiveTranscript(null);
                    const newMessage = { role: message.role, content: message.transcript };
                    setMessages((prev) => [newMessage, ...prev]);
                }
            }

            if (message.type === 'tool-calls') {
                const toolCalls = message.toolCallList || message.toolWithToolCallList || [];
                toolCalls.forEach((toolCall: any) => {
                    const fn = toolCall.function || toolCall.toolCall?.function;
                    if (!fn) return;
                    const fnName = fn.name;
                    if (fnName === 'render_visual') {
                        try {
                            const args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : fn.arguments;
                            const newItem: WhiteboardItem = {
                                id: `wb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                                type: args.type || 'text',
                                content: args.content || '',
                                title: args.title,
                                timestamp: Date.now(),
                            };
                            setWhiteboardItems((prev) => [...prev, newItem]);
                        } catch (e) {
                            console.error('Failed to parse render_visual args:', e);
                        }
                    }
                });
            }
        }

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);

        const onError = (error: Error) => console.log('Error', error);

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('error', onError);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('error', onError);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleMicrophone = () => {
        const isMuted = vapi.isMuted();
        vapi.setMuted(!isMuted);
        setIsMuted(!isMuted)
    }

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING)

        const assistantOverrides = {
            variableValues: { subject, topic, style },
            clientMessages: ["transcript", "tool-calls"],
            serverMessages: [],
        }

        // @ts-expect-error configureAssistant isn't correctly typed for vapi.start
        vapi.start(configureAssistant(voice, style), assistantOverrides)
    }

    const handleDisconnect = () => {
        setCallStatus(CallStatus.FINISHED)
        vapi.stop()
    }

    const downloadPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text(`Transcript with ${name}`, 10, 20);
        
        doc.setFontSize(12);
        let yPos = 30;
        const pageHeight = doc.internal.pageSize.height;
        
        // Reverse messages to chronological order
        const chronologicalMessages = [...messages].reverse();

        chronologicalMessages.forEach((message) => {
            if (message.content) {
                const speakerName = message.role === 'assistant' 
                    ? name.split(' ')[0].replace(/[,.]/g, '') 
                    : userName;
                const text = `${speakerName}: ${message.content}`;
                
                // Wrap text if needed
                const lines = doc.splitTextToSize(text, 180);
                
                // Check if we need to add a new page
                if (yPos + (lines.length * 7) > pageHeight - 10) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.text(lines, 10, yPos);
                yPos += (lines.length * 7) + 5;
            }
        });

        doc.save(`Transcript_${name.replace(/\s+/g, '_')}.pdf`);
    }

    return (
        <section className="flex flex-col flex-1 h-full min-h-[500px]">
            <section className="flex gap-8 max-sm:flex-col">
                <div className={cn('companion-section', whiteboardItems.length > 0 && callStatus === CallStatus.ACTIVE && 'companion-section--with-whiteboard')}>
                    <div className="companion-avatar" style={{ backgroundColor: getSubjectColor(subject)}}>
                        <div
                            className={
                            cn(
                                'absolute transition-opacity duration-1000', callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-1001' : 'opacity-0', callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse'
                            )
                        }>
                            <Image src={`/icons/${subject}.svg`} alt={subject} width={150} height={150} className="max-sm:w-fit" />
                        </div>

                        <div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100': 'opacity-0')}>
                            <Lottie
                                lottieRef={lottieRef}
                                animationData={soundwaves}
                                autoplay={false}
                                className="companion-lottie"
                            />
                        </div>
                    </div>
                    <p className="font-bold text-2xl">{name}</p>

                    <Whiteboard
                        items={whiteboardItems}
                        isVisible={callStatus === CallStatus.ACTIVE || callStatus === CallStatus.FINISHED}
                    />
                </div>

                <div className="user-section">
                    <div className="user-avatar">
                        <Image src={userImage} alt={userName} width={130} height={130} className="rounded-lg" />
                        <p className="font-bold text-2xl">
                            {userName}
                        </p>
                    </div>
                    <button className="btn-mic" onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE}>
                        <Image src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} alt="mic" width={36} height={36} />
                        <p className="max-sm:hidden">
                            {isMuted ? 'Turn on microphone' : 'Turn off microphone'}
                        </p>
                    </button>
                    {(callStatus === CallStatus.ACTIVE || timeElapsed > 0) && (
                        <div className="w-full flex flex-col gap-1 mt-1 mb-2">
                            <div className="flex justify-between text-xs text-white/70">
                                <span>{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</span>
                                <span>{duration}:00</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className="bg-primary h-full transition-all duration-1000 ease-linear" 
                                    style={{ width: `${Math.min((timeElapsed / (duration * 60)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                    <button 
                        className={cn(
                            'rounded-lg py-2 cursor-pointer transition-colors w-full text-white', 
                            callStatus === CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary', 
                            callStatus === CallStatus.CONNECTING && 'animate-pulse',
                            cooldownRemaining > 0 && callStatus !== CallStatus.ACTIVE && 'bg-white/20 cursor-not-allowed opacity-70'
                        )} 
                        onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
                        disabled={cooldownRemaining > 0 && callStatus !== CallStatus.ACTIVE}
                    >
                        {callStatus === CallStatus.ACTIVE
                            ? "End Session"
                            : callStatus === CallStatus.CONNECTING
                                ? 'Connecting'
                                : cooldownRemaining > 0
                                    ? `Cooldown (${cooldownRemaining}s)`
                                    : 'Start Session'
                        }
                    </button>
                    {callStatus === CallStatus.FINISHED && messages.length > 0 && (userPlan === 'pro' || userPlan === 'elite') && (
                        <button 
                            className="rounded-lg py-2 cursor-pointer transition-colors w-full text-white bg-green-600 hover:bg-green-700 mt-2" 
                            onClick={downloadPDF}
                        >
                            Download Transcript (PDF)
                        </button>
                    )}
                    {callStatus === CallStatus.FINISHED && messages.length > 0 && userPlan === 'free' && (
                        <p className="text-xs text-white/40 text-center mt-2">
                            📄 Upgrade to <span className="text-primary font-semibold">Pro</span> to download transcripts
                        </p>
                    )}
                </div>
            </section>

            <section className="transcript">
                <div className="transcript-message no-scrollbar">
                    {activeTranscript && (
                        <p className={activeTranscript.role === 'user' ? "text-primary max-sm:text-sm animate-pulse" : "max-sm:text-sm animate-pulse"}>
                            {activeTranscript.role === 'assistant' ? name.split(' ')[0].replace('/[.,]/g', '') : userName}: {activeTranscript.content}
                        </p>
                    )}
                    {messages.map((message, index) => {
                        if(message.role === 'assistant') {
                            return (
                                <p key={index} className="max-sm:text-sm">
                                    {
                                        name
                                            .split(' ')[0]
                                            .replace('/[.,]/g, ','')
                                    }: {message.content}
                                </p>
                            )
                        } else {
                           return <p key={index} className="text-primary max-sm:text-sm">
                                {userName}: {message.content}
                            </p>
                        }
                    })}
                </div>

                <div className="transcript-fade" />
            </section>
        </section>
    )
}

export default CompanionComponent
