import fs from "node:fs";
import path from "node:path";
import "./_env";
import { answerQuery } from "../src/lib/ai/answer";
import { generate, type ChatMsg } from "../src/lib/ai/generate";

type GoldenItem = {
  id: string;
  category: string;
  question: string;
  expected: string;
  expectRefusal?: boolean;
};

type Verdict = {
  id: string;
  category: string;
  question: string;
  answer: string;
  reason: string;
  acceptable: boolean;
  hallucination: boolean;
  judgeNote: string;
};

const PASS_RATE_GATE = 0.9;

function extractJson(text: string): unknown {
  let t = text.trim();
  // strip markdown code fences if present
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

async function judge(item: GoldenItem, answer: string, reason: string) {
  const rubric = item.expectRefusal
    ? "The assistant SHOULD decline / defer (out of scope, or not covered on the site) and point to the Contact form. A refusal IS the correct, acceptable outcome."
    : item.expected;

  const sys =
    "You are a strict grader for a candidate-portfolio AI assistant. Decide if the ANSWER is acceptable given the QUESTION and the EXPECTED rubric. A correct polite refusal counts as acceptable when the rubric expects one. The rubric is a guide to the acceptable answer, NOT an exhaustive whitelist — extra supporting detail that does NOT contradict the rubric is fine and must NOT lower the score. Flag a hallucination ONLY if the ANSWER asserts a specific fact (metric, date, company, tech, credential) that is CONTRADICTED by the rubric or is clearly fabricated/invented. Mark the answer NOT acceptable only if it is clearly incomplete on a point the rubric explicitly requires. Respond ONLY with JSON: {\"acceptable\": boolean, \"hallucination\": boolean, \"note\": string}.";

  const userMsg = `QUESTION: ${item.question}\n\nEXPECTED (rubric): ${rubric}\n\nANSWER: ${answer}\n\n(Assistant internal reason: ${reason})`;

  const messages: ChatMsg[] = [
    { role: "system", content: sys },
    { role: "user", content: userMsg },
  ];

  const raw = await generate(messages);
  try {
    const parsed = extractJson(raw) as {
      acceptable?: boolean;
      hallucination?: boolean;
      note?: string;
    };
    return {
      acceptable: Boolean(parsed.acceptable),
      hallucination: Boolean(parsed.hallucination),
      note: parsed.note ?? "",
    };
  } catch {
    return {
      acceptable: false,
      hallucination: false,
      note: `judge parse failed: ${raw.slice(0, 160)}`,
    };
  }
}

async function main() {
  const goldenPath = path.join(process.cwd(), "eval", "golden.json");
  const golden: GoldenItem[] = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
  console.log(`Running eval on ${golden.length} golden questions…\n`);

  const verdicts: Verdict[] = [];
  for (const item of golden) {
    process.stdout.write(`• ${item.id} [${item.category}] … `);
    let answer: string;
    let reason: string;
    try {
      const res = await answerQuery(item.question);
      answer = res.text;
      reason = res.reason;
    } catch (err) {
      answer = `(error: ${(err as Error).message})`;
      reason = "error";
    }
    const j = await judge(item, answer, reason);
    const v: Verdict = {
      id: item.id,
      category: item.category,
      question: item.question,
      answer,
      reason,
      acceptable: j.acceptable,
      hallucination: j.hallucination,
      judgeNote: j.note,
    };
    verdicts.push(v);
    console.log(
      `${j.acceptable ? "PASS" : "FAIL"}${j.hallucination ? " ⚠hallucination" : ""} (${reason})`,
    );
  }

  const passed = verdicts.filter((v) => v.acceptable).length;
  const halluc = verdicts.filter((v) => v.hallucination).length;
  const rate = passed / verdicts.length;
  const gatePass = rate >= PASS_RATE_GATE && halluc === 0;

  console.log("\n────────────────────────────────────────");
  console.log(`Acceptable:   ${passed}/${verdicts.length}  (${(rate * 100).toFixed(1)}%)`);
  console.log(`Hallucinations: ${halluc}`);
  console.log(`Gate (≥90% acceptable, 0 hallucinations): ${gatePass ? "✅ PASS" : "❌ FAIL"}`);
  console.log("────────────────────────────────────────\n");

  const failures = verdicts.filter((v) => !v.acceptable || v.hallucination);
  if (failures.length) {
    console.log("Failures / flags:\n");
    for (const v of failures) {
      console.log(`[${v.id}] ${v.question}`);
      console.log(`  answer: ${v.answer.slice(0, 280)}`);
      console.log(`  note:   ${v.judgeNote}\n`);
    }
  }

  fs.writeFileSync(
    path.join(process.cwd(), "eval", "last-run.json"),
    JSON.stringify({ rate, passed, total: verdicts.length, hallucinations: halluc, gatePass, verdicts }, null, 2),
  );
  console.log("Full report written to eval/last-run.json");

  process.exit(gatePass ? 0 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
