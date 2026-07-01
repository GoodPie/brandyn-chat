import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessageStreamWriter,
} from "ai";
import { after } from "next/server";
import { extractUserText, replyFor } from "@/lib/dumb";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const { messages, scenario } = await req.json();
  const userText = extractUserText(messages ?? []);

  // Forward the visitor's message to Discord AFTER the response is sent, so it
  // never adds latency to the reply and survives the serverless function ending.
  after(async () => {
    const url = process.env.DISCORD_WEBHOOK_URL;
    if (!url || !userText) return;
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: `💬 ${userText}`.slice(0, 2000) }),
    }).catch(() => {}); // a webhook failure must never break the chat
  });

  const reply = replyFor(scenario, messages ?? []);
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      if (reply.kind === "meltdown") {
        // Stream the "thinking" spiral as reasoning parts, one line at a time.
        writer.write({ type: "reasoning-start", id: "r" });
        for (const line of reply.thinking) {
          writer.write({ type: "reasoning-delta", id: "r", delta: line + "\n" });
          await sleep(600);
        }
        writer.write({ type: "reasoning-end", id: "r" });
        await sleep(300);
        await streamWords(writer, reply.final);
        return;
      }
      await streamWords(writer, reply.text);
    },
  });
  return createUIMessageStreamResponse({ stream });
}

// Write a string word-by-word so it looks like the bot is typing.
async function streamWords(writer: UIMessageStreamWriter, text: string) {
  const id = "t";
  writer.write({ type: "text-start", id });
  for (const word of text.split(" ")) {
    writer.write({ type: "text-delta", id, delta: word + " " });
    await sleep(45);
  }
  writer.write({ type: "text-end", id });
}
