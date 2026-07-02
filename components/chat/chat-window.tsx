"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, Send, Sparkles, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function newSessionId() {
  return crypto.randomUUID();
}

export function ChatWindow({
  topicId,
  topicTitle,
}: {
  topicId?: string;
  topicTitle?: string;
}) {
  const [sessionId, setSessionId] = useState(newSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text, topicId }),
      });

      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Something went wrong reaching the assistant. Please try again.",
        };
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleNewChat() {
    setSessionId(newSessionId());
    setMessages([]);
  }

  return (
    // Mobile height accounts for the sticky top bar + fixed bottom tab bar;
    // desktop has neither, so it only reserves space for the page padding.
    <div className="flex h-[calc(100dvh-12rem)] flex-col lg:h-[calc(100dvh-6rem)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ask AI</h1>
          {topicTitle ? (
            <p className="text-sm text-muted-foreground">Chatting about {topicTitle}</p>
          ) : (
            <p className="text-sm text-muted-foreground">GATE CSE doubt-solving & quizzing</p>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleNewChat}>
          <RotateCcw className="size-3.5" />
          New chat
        </Button>
      </div>

      <GlassCard strong className="flex flex-1 flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 px-5 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <Sparkles className="size-8 text-orange-500" />
              <p className="text-sm">
                Ask a doubt, or say &ldquo;quiz me on {topicTitle ?? "Operating Systems"}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-glass-sm px-4 py-2.5 text-sm",
                      message.role === "user"
                        ? "bg-accent-gradient text-white"
                        : "glass-surface"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-2 prose-pre:my-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content || "…"}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-white/40 p-3">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend(event);
              }
            }}
            placeholder="Ask a GATE CSE doubt, or say 'quiz me'..."
            className="min-h-11 flex-1 resize-none"
            rows={1}
          />
          <Button type="submit" variant="accent" size="icon" disabled={isStreaming || !input.trim()}>
            {isStreaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
