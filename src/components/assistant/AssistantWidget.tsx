"use client";

import { useEffect, useRef, useState } from "react";
import { Markdown } from "../Markdown";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What AI system did you ship in production?",
  "How did you cut DB CPU from 100% to under 25%?",
  "What's your tech stack?",
  "Are you open to remote roles?",
];

const STORAGE_KEY = "portfolio.chat.v1";
const SESSION_KEY = "portfolio.session";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const CTA_MARKER = "[CONTACT_CTA]";

/**
 * Split an assistant message around the Contact CTA marker.
 * - Full marker present → text before it + show the button.
 * - Trailing partial marker (mid-stream) → hide it so it doesn't flicker.
 * - Fallback → show the button if the answer itself points to contacting
 *   Alexander, even if the model omitted the marker.
 */
function splitCta(content: string): { text: string; showCta: boolean } {
  const fullIdx = content.indexOf(CTA_MARKER);
  if (fullIdx >= 0) {
    return { text: content.slice(0, fullIdx).replace(/\n+$/, ""), showCta: true };
  }
  for (let len = CTA_MARKER.length - 1; len > 0; len--) {
    if (content.endsWith(CTA_MARKER.slice(0, len))) {
      return { text: content.slice(0, content.length - len), showCta: false };
    }
  }
  const showCta =
    /\b(contact (form|alexander)|alexanderjacq02@gmail\.com|reach (alexander|him))\b/i.test(
      content,
    );
  return { text: content, showCta };
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>("ssr");

  useEffect(() => {
    sessionIdRef.current = getSessionId();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved) as Msg[]);
    } catch {
      /* ignore */
    }
    const openHandler = () => setOpen(true);
    window.addEventListener("open-assistant", openHandler);
    return () => window.removeEventListener("open-assistant", openHandler);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          sessionId: sessionIdRef.current,
          page: typeof location !== "undefined" ? location.pathname : "/",
        }),
      });
      if (!res.ok || !res.body) throw new Error("request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((curr) => {
          const copy = curr.slice();
          if (copy.length) copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      if (!acc.trim()) {
        setMessages((curr) => {
          const copy = curr.slice();
          if (copy.length) copy[copy.length - 1] = { role: "assistant", content: "I couldn't generate an answer. Please try the Contact form." };
          return copy;
        });
      }
    } catch {
      setMessages((curr) => {
        const copy = curr.slice();
        if (copy.length) copy[copy.length - 1] = { role: "assistant", content: "Sorry — something went wrong. Please use the Contact form." };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        aria-label="Open AI assistant"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-emerald-500/40 bg-zinc-900/90 px-4 py-3 font-mono text-sm text-emerald-400 shadow-lg shadow-emerald-500/10 backdrop-blur transition-transform hover:scale-105"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-emerald-400" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        {open ? "close" : "ask the AI"}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[32rem] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl shadow-black/50 backdrop-blur">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div>
              <p className="font-mono text-xs text-emerald-400">{`// portfolio AI`}</p>
              <p className="text-sm font-medium text-zinc-200">
                Ask about Alexander&rsquo;s work
              </p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={newConversation}
                className="font-mono text-[11px] text-zinc-500 hover:text-emerald-400"
              >
                new
              </button>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  I&rsquo;m an assistant grounded in Alexander&rsquo;s portfolio.
                  I answer only about his work — and say so if I don&rsquo;t know.
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:border-emerald-500/60 hover:text-emerald-300"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-500 px-3 py-2 text-sm text-zinc-950"
                      : "max-w-[90%] rounded-2xl rounded-bl-sm border border-zinc-800 bg-zinc-900/60 px-3 py-2"
                  }
                >
                  {m.role === "assistant" ? (
                    (() => {
                      const { text, showCta } = splitCta(m.content);
                      return (
                        <div className="text-sm text-zinc-200 [&>*:first-child]:mt-0 [&>*]:mt-2">
                          {text.trim() ? (
                            <Markdown>{text}</Markdown>
                          ) : !showCta ? (
                            <span className="text-zinc-500">…</span>
                          ) : null}
                          {showCta && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false);
                                setTimeout(
                                  () =>
                                    document
                                      .getElementById("contact")
                                      ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                                  60,
                                );
                              }}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 font-mono text-xs font-medium text-zinc-950 transition-colors hover:bg-emerald-400"
                            >
                              ✦ contact Alexander →
                            </button>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <p className="font-mono text-xs text-zinc-600">thinking…</p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-zinc-800 px-3 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ask a question…"
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-emerald-500 px-3 py-2 font-mono text-sm text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              ↵
            </button>
          </form>
        </div>
      )}
    </>
  );
}
