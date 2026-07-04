import { cn } from "@/lib/utils";

export function Section({
  id,
  label,
  title,
  children,
  className,
}: {
  id?: string;
  label: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 border-t border-zinc-800/80 py-16", className)}>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">
        {`// ${label}`}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}
