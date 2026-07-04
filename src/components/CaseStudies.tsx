import { getProjects } from "@/lib/content";
import { Markdown, stripLeadingH1 } from "./Markdown";

export function CaseStudies() {
  const items = getProjects();
  if (!items.length) return null;

  return (
    <div className="grid gap-5">
      {items.map((item) => {
        const tags = (item.data.tags as string[]) ?? [];
        return (
          <article
            key={item.slug}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="text-lg font-semibold text-zinc-100">
                {String(item.data.title ?? item.slug)}
              </h3>
              <span className="font-mono text-xs text-zinc-500">
                {String(item.data.company ?? "")} · {String(item.data.period ?? "")}
              </span>
            </div>
            {item.data.summary ? (
              <p className="mt-2 text-[15px] text-zinc-400">
                {String(item.data.summary)}
              </p>
            ) : null}
            <div className="mt-4">
              <Markdown>{stripLeadingH1(item.content)}</Markdown>
            </div>
            {tags.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[11px] text-zinc-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
