'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';

export interface WhiteboardItem {
    id: string;
    type: 'mermaid' | 'code' | 'text' | 'math';
    content: string;
    title?: string;
    timestamp: number;
}

interface WhiteboardProps {
    items: WhiteboardItem[];
    isVisible: boolean;
}

const MermaidBlock = ({ content, id }: { content: string; id: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const renderDiagram = async () => {
            try {
                const mermaid = (await import('mermaid')).default;
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'dark',
                    themeVariables: {
                        primaryColor: '#fe5933',
                        primaryTextColor: '#ffffff',
                        primaryBorderColor: '#fe5933',
                        lineColor: '#ffffff80',
                        secondaryColor: '#1a1a22',
                        tertiaryColor: '#09090b',
                        fontFamily: 'Bricolage Grotesque, sans-serif',
                        fontSize: '14px',
                        nodeBorder: '#fe5933',
                        mainBkg: '#1a1a22',
                        textColor: '#ffffff',
                    },
                });

                const { svg } = await mermaid.render(`mermaid-${id}`, content);
                setSvgContent(svg);
                setError(null);
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError(content);
            }
        };

        renderDiagram();
    }, [content, id]);

    if (error) {
        return (
            <div className="whiteboard-code-block">
                <pre><code>{error}</code></pre>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="whiteboard-mermaid"
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    );
};

const CodeBlock = ({ content }: { content: string }) => {
    const lines = content.split('\n');
    const language = lines[0]?.trim().toLowerCase() || '';
    const codeContent = lines.length > 1 ? lines.slice(1).join('\n') : content;

    return (
        <div className="whiteboard-code-block">
            {language && (
                <div className="whiteboard-code-lang">{language}</div>
            )}
            <pre>
                <code>{codeContent}</code>
            </pre>
        </div>
    );
};

const TextBlock = ({ content }: { content: string }) => {
    return (
        <div className="whiteboard-text-block">
            {content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
            ))}
        </div>
    );
};

const MathBlock = ({ content }: { content: string }) => {
    return (
        <div className="whiteboard-math-block">
            <span className="whiteboard-math-content">{content}</span>
        </div>
    );
};

const downloadItemAsPDF = (item: WhiteboardItem, itemElement: HTMLElement | null) => {
    const doc = new jsPDF();
    const title = item.title || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Visual`;
    const filename = `${title.replace(/\s+/g, '_')}.pdf`;

    // If it's a mermaid diagram, download as PNG image
    if (item.type === 'mermaid' && itemElement) {
        const svgElement = itemElement.querySelector('.whiteboard-mermaid svg') as SVGSVGElement;
        if (svgElement) {
            try {
                const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
                
                // Get the actual full dimensions from viewBox or rendered size
                const viewBox = svgElement.viewBox?.baseVal;
                const rect = svgElement.getBoundingClientRect();
                
                let svgWidth: number;
                let svgHeight: number;

                if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
                    svgWidth = viewBox.width;
                    svgHeight = viewBox.height;
                } else {
                    svgWidth = rect.width || 800;
                    svgHeight = rect.height || 600;
                }

                // Set explicit numeric dimensions and background on the clone
                svgClone.setAttribute('width', String(svgWidth));
                svgClone.setAttribute('height', String(svgHeight));
                svgClone.setAttribute('style', `background-color: #0d0d11;`);
                svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

                const svgData = new XMLSerializer().serializeToString(svgClone);
                const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
                const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

                const img = new Image();
                img.onload = () => {
                    const scale = 3;
                    const canvas = document.createElement('canvas');
                    canvas.width = svgWidth * scale;
                    canvas.height = svgHeight * scale;

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = '#0d0d11';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.scale(scale, scale);
                        ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
                    }

                    // Download as PNG directly
                    const pngUrl = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = `${title.replace(/\s+/g, '_')}.png`;
                    link.href = pngUrl;
                    link.click();
                };
                img.src = dataUrl;
                return;
            } catch (e) {
                console.error('SVG to PNG conversion failed, falling back to text PDF:', e);
            }
        }
    }

    // For code, text, math — or as fallback for mermaid
    doc.setFillColor(13, 13, 17);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

    doc.setTextColor(254, 89, 51);
    doc.setFontSize(16);
    doc.text(title, 10, 15);

    doc.setTextColor(230, 230, 230);
    doc.setFontSize(11);

    let content = item.content;
    if (item.type === 'code') {
        const lines = content.split('\n');
        if (lines.length > 1) {
            doc.setTextColor(254, 89, 51);
            doc.setFontSize(9);
            doc.text(lines[0].toUpperCase(), 10, 25);
            doc.setTextColor(230, 230, 230);
            doc.setFontSize(10);
            content = lines.slice(1).join('\n');
            const wrappedLines = doc.splitTextToSize(content, 180);
            doc.text(wrappedLines, 10, 32);
        } else {
            const wrappedLines = doc.splitTextToSize(content, 180);
            doc.text(wrappedLines, 10, 25);
        }
    } else if (item.type === 'math') {
        doc.setFontSize(14);
        doc.text(content, 10, 30);
    } else {
        const wrappedLines = doc.splitTextToSize(content, 180);
        doc.text(wrappedLines, 10, 25);
    }

    doc.save(filename);
};

const Whiteboard = ({ items, isVisible }: WhiteboardProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    const setItemRef = useCallback((id: string, el: HTMLDivElement | null) => {
        itemRefs.current.set(id, el);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [items]);

    if (!isVisible || items.length === 0) return null;

    return (
        <section className="whiteboard-container">
            <div className="whiteboard-header">
                <div className="whiteboard-header-dot whiteboard-header-dot--red" />
                <div className="whiteboard-header-dot whiteboard-header-dot--yellow" />
                <div className="whiteboard-header-dot whiteboard-header-dot--green" />
                <span className="whiteboard-header-title">AI Whiteboard</span>
            </div>
            <div ref={scrollRef} className="whiteboard-content no-scrollbar">
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        ref={(el) => setItemRef(item.id, el)}
                        className="whiteboard-item"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="whiteboard-item-header">
                            {item.title && (
                                <h3 className="whiteboard-item-title">{item.title}</h3>
                            )}
                            <button
                                className="whiteboard-download-btn"
                                onClick={() => downloadItemAsPDF(item, itemRefs.current.get(item.id) || null)}
                                title={item.type === 'mermaid' ? 'Download as PNG' : 'Download as PDF'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>{item.type === 'mermaid' ? 'PNG' : 'PDF'}</span>
                            </button>
                        </div>
                        {item.type === 'mermaid' && (
                            <MermaidBlock content={item.content} id={item.id} />
                        )}
                        {item.type === 'code' && <CodeBlock content={item.content} />}
                        {item.type === 'text' && <TextBlock content={item.content} />}
                        {item.type === 'math' && <MathBlock content={item.content} />}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Whiteboard;
