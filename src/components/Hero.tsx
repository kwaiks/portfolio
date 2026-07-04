import { AskAiButton } from "./AskAiButton";

const METRICS: { value: string; label: string }[] = [
  { value: "~73B IDR", label: "GMV / yr (platform scale)" },
  { value: "100%→<25%", label: "DB CPU (9M-row table)" },
  { value: "~2h→14s", label: "AI first-response time" },
  { value: "~50%", label: "infra cost reduction" },
];

export function Hero() {
  return (
    <section id="top" className="relative py-20 sm:py-28">
      <p className="font-mono text-sm text-emerald-400">{`// portfolio`}</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
        alexander jacquelline
      </h1>
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
        Senior Fullstack Engineer — Applied AI
      </p>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300">
        I build revenue-critical systems and ship production AI —{" "}
        <span className="text-emerald-400">RAG · guardrails · eval</span>. Indonesia
        based, open to remote.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="#contact"
          className="rounded-lg bg-emerald-500 px-4 py-2 font-mono text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          contact
        </a>
        <a
          href="/Alexander_Jacquelline_CV_v3.pdf"
          className="rounded-lg border border-zinc-700 px-4 py-2 font-mono text-sm text-zinc-300 transition-colors hover:border-emerald-500 hover:text-emerald-400"
        >
          resume.pdf
        </a>
        <AskAiButton className="rounded-lg border border-zinc-700 px-4 py-2 font-mono text-sm text-zinc-300 transition-colors hover:border-emerald-500 hover:text-emerald-400" />
      </div>

      <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800 sm:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.label} className="bg-zinc-950 p-4">
            <dt className="font-mono text-lg font-semibold text-emerald-400">
              {m.value}
            </dt>
            <dd className="mt-1 text-xs text-zinc-500">{m.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
