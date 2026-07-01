// The entire "brain" of the bot. Deliberately dumb. Each visitor is randomly
// assigned ONE scenario ("bit") for their whole conversation. Edit freely.

type TextPart = { type: string; text?: string };
type Message = { role?: string; parts?: TextPart[] };

/** Pull the latest user message's text out of the UIMessage parts[] array. */
export function extractUserText(messages: Message[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const text = (last?.parts ?? [])
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join(" ")
    .trim();
  return text.slice(0, 1000); // cap: don't relay huge payloads to Discord
}

export type ScenarioId =
  | "what"
  | "headphones"
  | "sayagain"
  | "nowhere"
  | "willie"
  | "birdup"
  | "meltdown";

export const SCENARIO_IDS: ScenarioId[] = [
  "what",
  "headphones",
  "sayagain",
  "nowhere",
  "willie",
  "birdup",
  "meltdown",
];

export type Reply =
  | { kind: "text"; text: string }
  | { kind: "meltdown"; thinking: string[]; final: string };

const pick = <T>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

const HEADPHONES = "oh lord, he got his headphones in. He can't hear a thing";
const NOWHERE =
  "Sorry dude, working on a new project that will go absolutely no where";

const MELTDOWN_WARMUP = ["What?", "hang on", "one sec, finding him", "who is this"];

const MELTDOWN_THINKING = [
  "Trying to find Brandyn",
  "Throwing a webhook or something. idk how this works",
  "oh lord, he missin'",
  "pretending to be Brandyn...",
  "Can't do that actually",
  "disabling chat box",
];

const WILLIE_INTRO = "Yeah cool, anyway, I think Willie Wagtails are really neat";

const WILLIE_FACTS = [
  "The willie wagtail is the largest of Australia's fantails, about 20 cm long, jet black above and clean white below, with a bold white eyebrow.",
  "Despite the name it's not a true wagtail at all — it's a fantail, unrelated to the wagtails of Europe and Asia.",
  "It's named for its signature move: constantly wagging its tail side to side to flush hidden insects into the open.",
  "Pound for pound one of the bravest birds alive — it'll fearlessly dive-bomb wedge-tailed eagles, kookaburras, magpies and ravens.",
  "It doesn't stop at birds — defending its nest it'll take on dogs, cats, and even humans who wander too close.",
  "Rival males flare their white eyebrows to look tough; the loser hides his eyebrow completely, disguising himself as a harmless youngster.",
  'Its most famous call is a sweet rolling chatter people describe as sounding like "sweet pretty creature."',
  "It's one of the few birds you'll hear singing right through the night, especially on moonlit nights in breeding season.",
  "Willie wagtails shadow grazing cattle and horses to catch stirred-up insects, and will even perch on livestock to pick off ticks and flies.",
  "They build a tidy cup nest bound with spider web and lined with fur or hair, often reusing the same spot year after year.",
  "They've embraced suburbia and are as at home on lawns, parks and gardens as in the bush.",
  "In several Aboriginal traditions the willie wagtail is a knowing gossip — an eavesdropper and teller of secrets.",
];

const BIRDUP_PROMO =
  "Whoa whoa whoa — before you go, have you heard about BirdUp? It's only the best birding companion ever built for Australia. Picture it: you're deep in a wetland, no signal for miles, and BAM — BirdUp logs your sighting in seconds, offline, because nothing waits and nothing's lost. See a bird, log it in seconds. Snap a photo and the AI tells you what it is — not some generic classifier, it knows what actually lives where you're standing, this time of year. Build your life list, chase your lifers, watch the Explore map light up with what's around you right now. It's a field notebook, a field guide, and a \"what's-around-me\" scout in the one app. Calm, not gamified. Conservation-aware by default — your patch and the birds both stay protected. Beginner? Perfect, you're exactly who we built it for. Get BirdUp at birdup.com.au and never wonder \"what was that bird?\" again. Anyway. What were you saying?";

// Fallback pool for a missing/unknown scenario (e.g. a raw API call with no bit).
const GENERIC = ["What?", "idk ask my manager", "have you considered not doing that"];

/** Produce the reply for a given scenario + conversation so far. */
export function replyFor(scenario: ScenarioId | string, messages: Message[]): Reply {
  const priorAssistant = messages.filter((m) => m.role === "assistant").length;

  switch (scenario) {
    case "what":
      return { kind: "text", text: pick(["What?", "ha?"]) };
    case "headphones":
      return { kind: "text", text: HEADPHONES };
    case "sayagain":
      return { kind: "text", text: "You can say that again" };
    case "nowhere":
      return { kind: "text", text: NOWHERE };
    case "birdup":
      return { kind: "text", text: BIRDUP_PROMO };
    case "willie":
      return {
        kind: "text",
        text: priorAssistant === 0 ? WILLIE_INTRO : pick(WILLIE_FACTS),
      };
    case "meltdown":
      // Two dumb warm-up replies, then it spirals on the third.
      if (priorAssistant < 2) return { kind: "text", text: pick(MELTDOWN_WARMUP) };
      return {
        kind: "meltdown",
        thinking: MELTDOWN_THINKING,
        final: "Something went wrong",
      };
    default:
      return { kind: "text", text: pick(GENERIC) };
  }
}
