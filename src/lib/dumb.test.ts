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

test("every scenario returns a non-empty reply (first + later turns)", () => {
  for (const s of SCENARIO_IDS) {
    for (const convo of [[user("hi")], [user("hi"), assistant("ok"), user("more")]]) {
      const r = replyFor(s, convo);
      if (r.kind === "text") assert.ok(r.text.length > 0, `${s} empty text`);
      else if (r.kind === "photo")
        assert.ok(r.caption.length > 0 && r.url.length > 0, `${s} bad photo`);
      else assert.ok(r.thinking.length > 0 && r.final.length > 0, `${s} bad meltdown`);
    }
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

test("each bird bit: intro first, facts after", () => {
  const birds = ["willie", "newholland", "wattlebird", "wedgetail", "raven"];
  for (const b of birds) {
    const first = replyFor(b, [user("hi")]);
    assert.ok(first.kind === "text" && first.text.startsWith("Yeah cool, anyway"), `${b} intro`);
    const later = replyFor(b, [user("hi"), assistant("intro"), user("go on")]);
    assert.ok(
      later.kind === "text" && !later.text.startsWith("Yeah cool, anyway"),
      `${b} should give a fact, not the intro`,
    );
  }
});

test("cats: intro, then photos in sequence, then 'And that's it'", () => {
  // convo with k prior assistant replies
  const convo = (k: number) => [
    user("hi"),
    ...Array.from({ length: k }, () => [assistant("a"), user("u")]).flat(),
  ];
  const first = replyFor("cats", convo(0));
  assert.ok(first.kind === "text" && first.text.includes("cats"));
  const s1 = replyFor("cats", convo(1));
  const s2 = replyFor("cats", convo(2));
  assert.ok(s1.kind === "photo" && s1.url === "/cats/arthur-1.jpg", "1st photo in order");
  assert.ok(s2.kind === "photo" && s2.url === "/cats/arthur-2.jpg", "2nd photo in order");
  const done = replyFor("cats", convo(7)); // after all 6 shots shown
  assert.ok(done.kind === "text" && done.text === "And that's it");
});

test("meltdown: warm-up text for first two replies, spirals on the third", () => {
  assert.equal(replyFor("meltdown", [user("hi")]).kind, "text");
  assert.equal(
    replyFor("meltdown", [user("hi"), assistant("What?"), user("hello")]).kind,
    "text",
  );
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
