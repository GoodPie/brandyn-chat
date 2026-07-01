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
  const list = messages ?? [];
  const userText = extractUserText(list);
  const isFirstReply = list.filter((m: { role?: string }) => m.role === "assistant").length === 0;

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

  const reply = replyFor(scenario, list);
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // Small "picking up my phone" pause before the very first reply; the
      // typing indicator shows while we wait.
      if (isFirstReply) await sleep(1200);

      if (reply.kind === "meltdown") {
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

      if (reply.kind === "photo") {
        await streamWords(writer, reply.caption);
        writer.write({ type: "file", url: reply.url, mediaType: "image/jpeg" });
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
