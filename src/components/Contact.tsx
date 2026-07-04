"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    // Capture the form element synchronously: e.currentTarget is nullified by
    // React once this async handler awaits, so we can't read it after `await`.
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      message: String(form.get("message") ?? ""),
      website: String(form.get("website") ?? ""), // honeypot
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus("success");
        formEl.reset();
      } else {
        setStatus("error");
        setErrorMsg(
          data.emailed === false && data.persisted
            ? "Saved — but the email notification didn't send. Alexander still received your message."
            : "Something went wrong. Please email alexanderjacq02@gmail.com directly.",
        );
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please email alexanderjacq02@gmail.com directly.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-6">
        <p className="font-mono text-sm text-emerald-400">{`// message sent`}</p>
        <p className="mt-2 text-zinc-300">
          Thanks — your message is logged and on its way to Alexander&rsquo;s
          inbox. He&rsquo;ll reply to your email directly.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 font-mono text-xs text-zinc-400 hover:text-emerald-400"
        >
          ← send another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-[15px] text-zinc-400">
        Recruiter or hiring manager? Send a note — it lands in
        Alexander&rsquo;s inbox with your address as the reply-to, and is
        logged so nothing gets lost. He&rsquo;s open to remote Applied AI /
        senior fullstack roles.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* honeypot */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="name" name="name" placeholder="Jane Recruiter" required />
          <Field label="email" name="email" type="email" placeholder="jane@company.com" required />
        </div>
        <div>
          <label htmlFor="message" className="font-mono text-xs uppercase tracking-wider text-emerald-400">
            message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={4}
            placeholder="Tell Alexander about the role…"
            className="mt-2 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[15px] text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        {status === "error" && (
          <p className="font-mono text-xs text-red-400">{errorMsg}</p>
        )}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-mono text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
        >
          {status === "submitting" ? "sending…" : "send message →"}
        </button>
      </form>
      <p className="font-mono text-xs text-zinc-600">
        prefer email?{" "}
        <a
          href="mailto:alexanderjacq02@gmail.com"
          className="text-emerald-400 hover:underline"
        >
          alexanderjacq02@gmail.com
        </a>
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="font-mono text-xs uppercase tracking-wider text-emerald-400">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[15px] text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
}
