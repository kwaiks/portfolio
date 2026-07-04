"use client";

export function AskAiButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-assistant"))}
      className={className}
    >
      ask the AI ▾
    </button>
  );
}
