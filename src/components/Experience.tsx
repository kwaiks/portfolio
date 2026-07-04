import { getExperiences } from "@/lib/content";
import { Markdown, stripLeadingH1 } from "./Markdown";

export function Experience() {
  const items = getExperiences();
  if (!items.length) return null;

  return (
    <ol className="relative space-y-8 border-l border-zinc-800 pl-6">
      {items.map((item) => (
        <li key={item.slug} className="relative">
          <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-emerald-500" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="text-base font-semibold text-zinc-100">
              {String(item.data.role ?? item.data.title ?? item.slug)}
            </h3>
            <span className="font-mono text-xs text-zinc-500">
              {String(item.data.period ?? "")}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-xs uppercase tracking-wider text-emerald-400">
            {String(item.data.company ?? "")}
            {item.data.current ? " · current" : ""}
          </p>
          <div className="mt-3">
            <Markdown>{stripLeadingH1(item.content)}</Markdown>
          </div>
        </li>
      ))}
    </ol>
  );
}
