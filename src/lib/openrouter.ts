import "server-only";
import { UserError } from "./action-state";

/** MiniMax M3.1 Flash on OpenRouter. The API is the OpenAI chat-completions shape. */
export const VISION_MODEL = "minimax/minimax-m3.1-flash";

export function isVisionConfigured() {
  return !!process.env.OPENROUTER_API_KEY;
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function completeJson(system: string, user: ContentPart[]): Promise<unknown> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new UserError("Photo reading isn't configured yet. Add OPENROUTER_API_KEY.");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Kunchanada",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(50_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("openrouter", res.status, detail.slice(0, 500));
    throw new UserError("The photo reading didn't complete. Try again in a moment.");
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string | { type?: string; text?: string }[] } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  const text =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map((part) => part.text ?? "").join("")
        : "";
  if (!text.trim()) throw new UserError("The photo reading came back empty. Try another photo.");
  return parseModelJson(text);
}

function parseModelJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? text).trim();
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new UserError("The photo reading wasn't readable. Try again.");
  }
}
