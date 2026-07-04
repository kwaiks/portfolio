export function Footer() {
  return (
    <footer className="mt-10 border-t border-zinc-800/80 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4 font-mono text-xs">
          <a
            href="mailto:alexanderjacq02@gmail.com"
            className="text-zinc-400 hover:text-emerald-400"
          >
            email
          </a>
          <a
            href="https://github.com/kwaiks"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:text-emerald-400"
          >
            github
          </a>
          <a
            href="https://linkedin.com/in/alexander-jacquelline"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:text-emerald-400"
          >
            linkedin
          </a>
        </div>
      </div>
      <p className="mt-6 font-mono text-[11px] text-zinc-600">
        © {new Date().getFullYear()} Alexander Jacquelline · open to remote
      </p>
    </footer>
  );
}
