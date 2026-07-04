import "./_env";
import { config } from "../src/lib/config";

async function main() {
  console.log("model:    ", config.deepseek.model);
  console.log("baseURL:  ", config.deepseek.baseURL);
  console.log("apiKey:   ", config.deepseek.apiKey ? "set ✓" : "MISSING ✗");

  if (!config.deepseek.apiKey) {
    console.error("Set DEEPSEEK_API_KEY in .env.local first.");
    process.exit(1);
  }

  const url = `${config.deepseek.baseURL.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.deepseek.apiKey}`,
    },
    body: JSON.stringify({
      model: config.deepseek.model,
      messages: [{ role: "user", content: "Reply with the single word: ok" }],
      max_tokens: 5,
      temperature: 0,
    }),
  });

  const body = await res.text();
  console.log("status:   ", res.status);

  if (!res.ok) {
    console.error("❌ Request failed.");
    console.error("body:", body.slice(0, 800));
    if (body.includes("model") || res.status === 404) {
      console.error(
        "\nLikely a bad model id. Edit DEEPSEEK_MODEL in .env.local (e.g. try 'deepseek-chat') and re-run.",
      );
    }
    process.exit(1);
  }

  try {
    const json = JSON.parse(body);
    const reply = json.choices?.[0]?.message?.content ?? "(empty)";
    console.log("✅ Model reachable. Reply:", reply.trim());
  } catch {
    console.log("✅ Model reachable (2xx) but could not parse body.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
