import { test } from "node:test";
import assert from "node:assert/strict";
import { extractUserText, replyFor, SCENARIO_IDS } from "./dumb.ts";

const user = (t: string) => ({ role: "user", parts: [{ type: "text", text: t }] });
const assistant = (t: string) => ({
  role: "assistant",
  parts: [{ type: "text", text: t }],
});

test("extractUserText pulls text from the latest user message parts[]", () => {
  assert.equal(extractUserText([assistant("beep"), user("hello there")]), "hello there");
});

test("extractUserText caps length at 1000 chars", () => {
  assert.equal(extractUserText([user("x".repeat(5000))]).length, 1000);
});

test("extractUserText returns empty string when no user message", () => {
  assert.equal(extractUserText([]), "");
});

test("every scenario returns a non-empty reply", () => {
  for (const s of SCENARIO_IDS) {
    const r = replyFor(s, [user("hi")]);
    if (r.kind === "text") assert.ok(r.text.length > 0, `${s} empty text`);
    else assert.ok(r.thinking.length > 0 && r.final.length > 0, `${s} empty meltdown`);
  }
});

test("what only ever says What?/ha?", () => {
  for (let i = 0; i < 20; i++) {
    const r = replyFor("what", [user("anything")]);
    assert.ok(r.kind === "text" && ["What?", "ha?"].includes(r.text));
  }
});

test("fixed-line bits are constant", () => {
  assert.deepEqual(replyFor("sayagain", [user("x")]), {
    kind: "text",
    text: "You can say that again",
  });
  const hp = replyFor("headphones", [user("x")]);
  assert.ok(hp.kind === "text" && hp.text.includes("headphones"));
});

test("willie: first reply is the intro, later replies are facts", () => {
  const first = replyFor("willie", [user("hi")]);
  assert.ok(first.kind === "text" && first.text.startsWith("Yeah cool, anyway"));
  const later = replyFor("willie", [user("hi"), assistant("Yeah cool"), user("go on")]);
  assert.ok(later.kind === "text" && !later.text.startsWith("Yeah cool, anyway"));
});

test("meltdown: warm-up text for first two replies, spirals on the third", () => {
  // 0 prior assistant messages -> warm-up
  assert.equal(replyFor("meltdown", [user("hi")]).kind, "text");
  // 1 prior -> still warm-up
  assert.equal(
    replyFor("meltdown", [user("hi"), assistant("What?"), user("hello")]).kind,
    "text",
  );
  // 2 prior -> meltdown
  const m = replyFor("meltdown", [
    user("hi"),
    assistant("What?"),
    user("hello"),
    assistant("hang on"),
    user("???"),
  ]);
  assert.equal(m.kind, "meltdown");
  assert.ok(m.kind === "meltdown" && m.final === "Something went wrong");
});

test("unknown scenario falls back to a text reply", () => {
  assert.equal(replyFor("nonsense", [user("x")]).kind, "text");
});
