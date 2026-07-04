/**
 * Centralised server-side configuration read from environment variables.
 * Everything here is NON-public (no NEXT_PUBLIC_ prefix) so it is inlined
 * only into server bundles. Never import this from a client component.
 */
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    // Dashboard "publishable" key (formerly the "anon" key).
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    // Dashboard "secret" key (formerly "service_role"). Legacy name accepted.
    secretKey:
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      "",
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY ?? "",
    baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1",
    // deepseek-chat is confirmed live; env-overridable + eval-gated.
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
    contactEmail: process.env.CONTACT_EMAIL ?? "alexanderjacq02@gmail.com",
  },
} as const;

export function assertServerConfig(keys: string[]) {
  const missing = keys.filter((k) => {
    const [group, field] = k.split(".");
    // @ts-expect-error indexed access for runtime check
    const val = config[group]?.[field];
    return !val;
  });
  if (missing.length) {
    throw new Error(`Missing required server env config: ${missing.join(", ")}`);
  }
}
