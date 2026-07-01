"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SCENARIO_IDS, type ScenarioId } from "@/lib/dumb";

type Msg = { parts: { type: string; text?: string }[] };
const partsText = (m: Msg, type: string) =>
  m.parts
    .filter((p) => p.type === type)
    .map((p) => p.text ?? "")
    .join("");

export default function Page() {
  const [input, setInput] = useState("");
  // Each visitor is randomly assigned one "bit" for the whole conversation and
  // sends it with every request. Picked once on mount; doesn't affect initial
  // markup, so no hydration mismatch.
  const [scenario] = useState<ScenarioId>(
    () => SCENARIO_IDS[Math.floor(Math.random() * SCENARIO_IDS.length)],
  );
  const [transport] = useState(
    () => new DefaultChatTransport({ api: "/api/chat", body: { scenario } }),
  );
  const { messages, sendMessage, status } = useChat({ transport });
  const endRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  const assistantCount = messages.filter((m) => m.role === "assistant").length;
  const locked = scenario === "meltdown" && assistantCount >= 3;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || status !== "ready" || locked) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-black/10 dark:border-white/10 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Image
            src="/brandyn.jpg"
            alt="Brandyn Britton"
            width={36}
            height={36}
            priority
            className="size-9 rounded-full object-cover"
          />
          <div className="leading-tight">
            <p className="font-semibold">Brandyn Britton</p>
            <p className="flex items-center gap-1.5 text-xs text-foreground/60">
              <span className="size-2 rounded-full bg-green-500" aria-hidden />
              Online
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 overflow-y-auto min-h-0"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
          {messages.length === 0 && (
            <div className="mt-16 text-center text-foreground/50">
              <p className="text-lg font-medium text-foreground/70">
                Hey, I&rsquo;m Brandyn.
              </p>
              <p className="mt-1 text-sm">
                Years of training advanced AI (array intelligence) models to
                speak exactly like me
              </p>
            </div>
          )}

          {messages.map((m) => {
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-blue-600 px-4 py-2.5 text-[15px] leading-relaxed text-white">
                    {partsText(m, "text")}
                  </div>
                </div>
              );
            }
            const reasoning = partsText(m, "reasoning");
            const text = partsText(m, "text");
            return (
              <div key={m.id} className="flex flex-col items-start gap-2">
                {reasoning && (
                  <div className="max-w-[85%] rounded-2xl bg-black/5 px-4 py-2.5 text-[13px] text-foreground/50 dark:bg-white/5">
                    <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground/40">
                      <span className="size-1.5 rounded-full bg-foreground/40 motion-safe:animate-pulse" />
                      Thinking
                    </p>
                    <p className="whitespace-pre-wrap">{reasoning}</p>
                  </div>
                )}
                {text && (
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-black/5 px-4 py-2.5 text-[15px] leading-relaxed dark:bg-white/10">
                    {text}
                  </div>
                )}
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="flex justify-start" aria-label="Assistant is typing">
              <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-black/5 px-4 py-3 dark:bg-white/10">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="size-2 animate-bounce rounded-full bg-foreground/40 motion-reduce:animate-none"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </main>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-black/10 dark:border-white/10 bg-background/80 backdrop-blur">
        <form
          onSubmit={onSubmit}
          className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3"
        >
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <input
            id="message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={locked ? "Chat unavailable" : "Message Brandyn…"}
            autoComplete="off"
            disabled={locked}
            className="flex-1 rounded-full border border-black/15 bg-background px-4 py-2.5 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 dark:border-white/15"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy || locked}
            aria-label="Send message"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-white transition-opacity focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
              aria-hidden
            >
              <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
              <path d="m21.854 2.147-10.94 10.939" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
