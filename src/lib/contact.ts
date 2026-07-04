import { z } from "zod";
import { Resend } from "resend";
import { config } from "./config";
import { getSupabaseAdmin } from "./supabase/admin";

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(5).max(4000),
  // Honeypot: must stay empty.
  website: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactResult = {
  ok: boolean;
  persisted: boolean;
  emailed: boolean;
  error?: string;
};

/**
 * Persist-first contact handler: the submission row is saved BEFORE we
 * attempt email, so a message is never lost even if the email provider
 * fails. Email Reply-To is the sender, so we can reply directly.
 */
export async function submitContact(
  raw: unknown,
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, persisted: false, emailed: false, error: "invalid" };
  }
  // Honeypot tripped = bot; pretend success, do nothing.
  if (parsed.data.website) {
    return { ok: true, persisted: false, emailed: false };
  }

  const { name, email, message } = parsed.data;
  let persisted = false;

  try {
    const { error } = await getSupabaseAdmin()
      .from("contact_submissions")
      .insert({ name, email, message, status: "new" });
    persisted = !error;
  } catch {
    persisted = false;
  }

  let emailed = false;
  if (config.resend.apiKey) {
    try {
      const resend = new Resend(config.resend.apiKey);
      await resend.emails.send({
        from: config.resend.from,
        to: config.resend.contactEmail,
        replyTo: email,
        subject: `Portfolio contact — ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      });
      emailed = true;
    } catch {
      emailed = false;
    }
  }

  return {
    ok: persisted || emailed,
    persisted,
    emailed,
    error: persisted || emailed ? undefined : "server_error",
  };
}
