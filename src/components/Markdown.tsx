import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Strip a leading "# Title" line (the page title) so it isn't double-rendered. */
export function stripLeadingH1(md: string): string {
  return md.replace(/^#\s+.+\n?/, "").trim();
}

export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[15px] leading-relaxed text-zinc-300 [&>*:first-child]:mt-0 [&>*]:mt-3",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3 className="mt-6 text-base font-semibold text-zinc-100">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="mt-6 text-base font-semibold text-zinc-100">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mt-5 text-sm font-semibold text-emerald-400">{children}</h4>
          ),
          p: ({ children }) => <p className="mt-3">{children}</p>,
          ul: ({ children }) => (
            <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-zinc-600">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 marker:text-zinc-600">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="text-emerald-400 underline decoration-emerald-500/40 underline-offset-2 hover:decoration-emerald-400"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-100">{children}</strong>
          ),
          code: ({ children }) => (
            <code className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-300">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="mt-3 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4 font-mono text-sm">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-3 border-l-2 border-emerald-500/50 pl-4 text-zinc-400">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-zinc-800" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
