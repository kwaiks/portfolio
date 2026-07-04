import { getStack } from "@/lib/content";
import { Markdown, stripLeadingH1 } from "./Markdown";

export function Stack() {
  const stack = getStack();
  if (!stack) return null;
  const groups = (stack.data.groups as Record<string, string[]>) ?? {};

  return (
    <div className="space-y-8">
      <Markdown>{stripLeadingH1(stack.content)}</Markdown>
      <div className="grid gap-5 sm:grid-cols-2">
        {Object.entries(groups).map(([label, items]) => (
          <div
            key={label}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
          >
            <p className="font-mono text-xs uppercase tracking-wider text-emerald-400">
              {label}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {items.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-zinc-800/70 px-2 py-1 font-mono text-xs text-zinc-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
