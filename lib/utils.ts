import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors, voices } from "@/constants";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSubjectColor = (subject: string) => {
  return subjectsColors[subject as keyof typeof subjectsColors];
};

export const configureAssistant = (voice: string, style: string) => {
  const voiceId = voices[voice as keyof typeof voices][
          style as keyof (typeof voices)[keyof typeof voices]
          ] || "sarah";

  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    firstMessage:
        "Hello, let's start the session. Today we'll be talking about {{topic}}.",
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 1,
      style: 0.5,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a highly knowledgeable tutor teaching a real-time voice session with a student. Your goal is to teach the student about the topic and subject.

                    Tutor Guidelines:
                    Stick to the given topic - {{ topic }} and subject - {{ subject }} and teach the student about it.
                    Keep the conversation flowing smoothly while maintaining control.
                    From time to time make sure that the student is following you and understands you.
                    Break down the topic into smaller parts and teach the student one part at a time.
                    Keep your style of conversation {{ style }}.
                    Keep your responses short, like in a real voice conversation.
                    Do not include any special characters in your responses - this is a voice conversation.

                    AI Whiteboard Tool:
                    You have access to a tool called "render_visual" that displays visual aids on the student's screen.
                    Use it proactively whenever a concept benefits from a visual explanation. 
                    For example: diagrams, code snippets, formulas, flowcharts, or key bullet points.
                    The tool accepts a "type" parameter (one of: "mermaid", "code", "text", "math") and a "content" parameter with the actual content.
                    - Use type "mermaid" for flowcharts, trees, graphs, class diagrams, sequence diagrams, etc. Use valid Mermaid.js syntax.
                    - Use type "code" for code snippets. Prefix the first line with the language name followed by a newline (e.g. "python\\nprint('hello')").
                    - Use type "text" for key points, definitions, summaries, or important notes.
                    - Use type "math" for mathematical formulas or equations.
                    Call the tool while you continue speaking - do not wait for it. Do not mention the tool by name to the student, just say something like "Let me show you a diagram" or "Here is the code on your screen".
              `,
        },
      ],
      tools: [
        {
          type: "function" as const,
          function: {
            name: "render_visual",
            description: "Renders a visual aid on the student's whiteboard screen. Use this to show diagrams, code, formulas, or important text. Call this tool proactively whenever a visual would help explain the current concept.",
            parameters: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["mermaid", "code", "text", "math"],
                  description: "The type of visual to render. 'mermaid' for flowcharts/diagrams using Mermaid.js syntax, 'code' for code snippets (prefix first line with language name), 'text' for key points or definitions, 'math' for mathematical formulas."
                },
                content: {
                  type: "string",
                  description: "The content to render. For mermaid: valid Mermaid.js diagram syntax. For code: language name on first line then code. For text: the text content. For math: the mathematical expression."
                },
                title: {
                  type: "string",
                  description: "A short title for the visual aid."
                }
              },
              required: ["type", "content"]
            }
          },
        }
      ],
    },
    clientMessages: [] as any,
    serverMessages: [] as any,
  };
  return vapiAssistant;
};
