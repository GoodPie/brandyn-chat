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
  | "birdup"
  | "meltdown"
  | "willie"
  | "newholland"
  | "wattlebird"
  | "wedgetail"
  | "raven"
  | "cats";

export const SCENARIO_IDS: ScenarioId[] = [
  "what",
  "headphones",
  "sayagain",
  "nowhere",
  "birdup",
  "meltdown",
  "willie",
  "newholland",
  "wattlebird",
  "wedgetail",
  "raven",
  "cats",
];

export type Reply =
  | { kind: "text"; text: string }
  | { kind: "photo"; caption: string; url: string }
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

// --- Birds: each is its own bit. Intro on the first reply, random fact after. ---
const BIRDS: Record<string, { intro: string; facts: string[] }> = {
  willie: {
    intro: "Yeah cool, anyway, I think Willie Wagtails are really neat",
    facts: [
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
    ],
  },
  newholland: {
    intro: "Yeah cool, anyway, I think New Holland Honeyeaters are really neat",
    facts: [
      "It's the punk of the honeyeater world: streaky black-and-white plumage, flashes of yellow on the wings and tail, and a wild staring white eye that makes it look permanently caffeinated.",
      "It almost never sits still, darting flower to flower so restlessly that birdwatchers struggle to get a proper look at one.",
      "Nectar is its jet fuel, and it sips it with a long, brush-tipped tongue that laps deep into banksias and grevilleas.",
      "It's a serious pollinator, ferrying pollen between banksias, hakeas, grevilleas and grasstrees as it feeds.",
      "For a small bird it's fiercely territorial, aggressively chasing other honeyeaters and even rainbow lorikeets off its favourite flowering bush.",
      "When a hawk or other predator shows up, a whole group will band together and mob it with loud alarm calls.",
      'Its voice is a sharp, loud "chik" plus a fainter "pseet" and a lot of busy chattering.',
      "Pairs build a neat cup nest of bark and grass bound together with spider web, and both parents pitch in to feed the chicks.",
      "Given enough flowers, it can breed almost year-round and raise several broods in a single year.",
      "It's one of the easiest natives to lure into a garden: plant grevilleas and banksias and it'll happily move in.",
    ],
  },
  wattlebird: {
    intro: "Yeah cool, anyway, I think Red Wattlebirds are really neat",
    facts: [
      "It's the second-largest honeyeater in Australia, a hefty 33 to 37 cm and beaten only by the Tasmanian yellow wattlebird.",
      "It's named for the dangly pinkish-red wattles hanging off the sides of its neck, paired with a bright yellow belly patch.",
      "As one of the largest nectar-feeding birds on Earth, it laps up nectar with a specialised brush-tipped tongue carrying around 120 tiny bristles.",
      "It's a loud, aggressive bully that will snap at tails, dive at rivals, and mob birds far bigger than itself, including magpies and kookaburras.",
      "Its calls are gloriously ugly, a raucous, coughing, hiccuping cackle that sounds like the bird is choking on its own opinions.",
      "It's mostly a nectar drinker, working eucalypts, banksias and grasstrees, but it'll snap up insects on the side.",
      "It ranges across the south of the continent, from southeast Queensland down through Victoria and over to southwest WA, and is right at home in parks and gardens.",
      "It nests in a rough cup of sticks wedged in a tree fork, laying two or three pinkish, spotted eggs, usually raising one or two broods a season.",
      "After breeding it gets social, gathering into winter flocks that can number several hundred birds.",
      "It has a sweet tooth that gets it in trouble, occasionally raiding orchards and vineyards for grapes, figs, olives and stone fruit.",
    ],
  },
  wedgetail: {
    intro: "Yeah cool, anyway, I think Wedge-tailed Eagles are really neat",
    facts: [
      "The wedge-tailed eagle is Australia's largest bird of prey, standing up to a metre tall with a wingspan that typically stretches around 2.3 metres.",
      "The biggest wingspan ever recorded belonged to a Tasmanian bird measured back in 1931 at a staggering 2.84 metres, tip to tip.",
      "It's named for its long, diamond-shaped tail, which fans out into an unmistakable wedge when the bird soars overhead.",
      "Unlike sea-eagles, its legs are feathered all the way down to the toes, like it's wearing a pair of fluffy trousers.",
      "It happily eats carrion and roadkill, but rabbits often make up the bulk of its diet and pairs can team up to bring down prey as large as a fully grown kangaroo.",
      "On a good day it rides thermals to around 1,800 metres and can hang up there for hours, barely flapping.",
      "Its stick nest is a genuine mansion, reused year after year until it can measure nearly 2 metres across and weigh as much as 400 kilograms.",
      "Females are the bigger, heavier sex, tipping the scales at over 5 kilograms while the males stay comparatively dainty.",
      "Fiercely protective of its patch, it's been known to swoop and attack hang gliders, model aircraft and drones that stray too close to the nest.",
      "To the Kulin nation of Victoria the wedge-tailed eagle is Bunjil, the creator spirit who watches over the land, and today it's an official faunal emblem of the Northern Territory.",
    ],
  },
  raven: {
    intro: "Yeah cool, anyway, I think Australian Ravens are really neat",
    facts: [
      "The Australian raven is a big, glossy all-black bird, 46 to 53 centimetres long, whose feathers shine with a blue-purple sheen in the right light.",
      'Its most famous sound is a long, mournful "aaaah" that trails off at the end, so drawn-out and eerie it\'s often described as a death rattle.',
      "When it lets out that wail it leans forward almost horizontal and fluffs out the long throat feathers under its chin, giving itself a shaggy little beard.",
      "You can tell an adult from a crow by its striking white eyes, though youngsters start out dark-eyed and change as they grow up.",
      "Australian ravens are devoted partners that pair up and mate for life, defending the same territory together year after year.",
      "It's an opportunistic omnivore, tucking into insects, carrion, fruit, seeds and even the chicks of other birds when the chance arises.",
      "Clever as all corvids are, it uses fence posts as anvils to smash snails open and has been seen dunking chunks of meat in water before eating them.",
      "It has a weakness for golf balls, occasionally pinching them off the fairway, apparently mistaking the round white lumps for eggs.",
      "These birds are long-lived for their size, with one banded individual recaptured alive more than 12 years later.",
      "In Aboriginal traditions the crow is Waa, a cunning trickster and ancestral being, paired in Kulin cosmology with Bunjil the eaglehawk.",
    ],
  },
};

// --- Cats: intro on the first reply, then a random cat photo + caption. ---
const CATS_INTRO = "oh you want to see the cats? say less";
const CAT_SHOTS = [
  {
    caption: "This is Arthur. He has two brain cells and they take shifts.",
    url: "/cats/arthur-1.jpg",
  },
  {
    caption: "Arthur again. He does not know what a bird is and never will.",
    url: "/cats/arthur-2.jpg",
  },
  {
    caption: "Artemus. Absolute floof unit. Zero thoughts, head empty.",
    url: "/cats/artemus-1.jpg",
  },
  {
    caption:
      "This is Artemus. He's either plotting something or asleep. Same face.",
    url: "/cats/artemus-2.jpg",
  },
  {
    caption: "This is Claudie. Yes, like the AI. No, I won't be taking questions.",
    url: "/cats/claudie-1.jpg",
  },
  {
    caption: "Claudie found a box. Peak performance. Nothing else planned today.",
    url: "/cats/claudie-2.jpg",
  },
];

const BIRDUP_PROMO =
  "Whoa whoa whoa — before you go, have you heard about BirdUp? It's only the best birding companion ever built for Australia. Picture it: you're deep in a wetland, no signal for miles, and BAM — BirdUp logs your sighting in seconds, offline, because nothing waits and nothing's lost. See a bird, log it in seconds. Snap a photo and the AI tells you what it is — not some generic classifier, it knows what actually lives where you're standing, this time of year. Build your life list, chase your lifers, watch the Explore map light up with what's around you right now. It's a field notebook, a field guide, and a \"what's-around-me\" scout in the one app. Calm, not gamified. Conservation-aware by default — your patch and the birds both stay protected. Beginner? Perfect, you're exactly who we built it for. Get BirdUp at birdup.com.au and never wonder \"what was that bird?\" again. Anyway. What were you saying?";

// Fallback pool for a missing/unknown scenario (e.g. a raw API call with no bit).
const GENERIC = ["What?", "idk ask my manager", "have you considered not doing that"];

/** Produce the reply for a given scenario + conversation so far. */
export function replyFor(scenario: ScenarioId | string, messages: Message[]): Reply {
  const priorAssistant = messages.filter((m) => m.role === "assistant").length;

  const bird = typeof scenario === "string" ? BIRDS[scenario] : undefined;
  if (bird) {
    return {
      kind: "text",
      text: priorAssistant === 0 ? bird.intro : pick(bird.facts),
    };
  }

  if (scenario === "cats") {
    if (priorAssistant === 0) return { kind: "text", text: CATS_INTRO };
    const shot = CAT_SHOTS[priorAssistant - 1]; // one per reply, in order
    if (!shot) return { kind: "text", text: "And that's it" };
    return { kind: "photo", caption: shot.caption, url: shot.url };
  }

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
