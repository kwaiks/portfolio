import { getAiWriteup } from "@/lib/content";
import { Markdown, stripLeadingH1 } from "./Markdown";

export function AiWriteup() {
  const writeup = getAiWriteup();
  if (!writeup) return null;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
      <Markdown>{stripLeadingH1(writeup.content)}</Markdown>
    </div>
  );
}
