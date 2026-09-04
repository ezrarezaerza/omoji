export interface MemeTextPreset {
  id: string;
  name: string;
  category: "classic" | "speech" | "reaction";
  description: string;
  texts: Array<{
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    fill: string;
    stroke: string;
    strokeWidth: number;
    rotation?: number;
    isUppercase?: boolean;
    bubbleStyle?: "none" | "badge" | "speech" | "thought" | "shout";
    bubbleFill?: string;
    bubbleStroke?: string;
    arc?: number;
  }>;
}

export const MEME_FONTS = [
  { id: "impact", name: "Impact / Meme", family: "Anton, Impact, sans-serif" },
  { id: "bangers", name: "Bangers Comic", family: "'Bangers', Impact, cursive" },
  { id: "marker", name: "Marker Doodler", family: "'Permanent Marker', cursive" },
  { id: "fredoka", name: "Fredoka Rounded", family: "'Fredoka', sans-serif" },
  { id: "space", name: "Space Grotesk", family: "'Space Grotesk', sans-serif" },
];

export const POPULAR_MEME_PRESETS: MemeTextPreset[] = [
  {
    id: "top-bottom-classic",
    name: "Classic Top & Bottom",
    category: "classic",
    description: "Traditional 2-line Impact meme format",
    texts: [
      {
        text: "WHEN YOU FINALLY",
        x: 256,
        y: 44,
        fontSize: 34,
        fontFamily: "Anton, Impact, sans-serif",
        fill: "#ffffff",
        stroke: "#000000",
        strokeWidth: 8,
        isUppercase: true,
      },
      {
        text: "FIGURE IT OUT",
        x: 256,
        y: 468,
        fontSize: 34,
        fontFamily: "Anton, Impact, sans-serif",
        fill: "#ffffff",
        stroke: "#000000",
        strokeWidth: 8,
        isUppercase: true,
      },
    ],
  },
  {
    id: "speech-bubble",
    name: "Comic Speech Bubble",
    category: "speech",
    description: "Classic speech bubble with white badge & black border",
    texts: [
      {
        text: "Did you say stickers?!",
        x: 256,
        y: 65,
        fontSize: 24,
        fontFamily: "'Fredoka', sans-serif",
        fill: "#000000",
        stroke: "#000000",
        strokeWidth: 0,
        bubbleStyle: "speech",
        bubbleFill: "#ffffff",
        bubbleStroke: "#000000",
      },
    ],
  },
  {
    id: "thought-bubble",
    name: "Thought Cloud",
    category: "speech",
    description: "Thinking aloud bubble with dots",
    texts: [
      {
        text: "What if it was a meme?",
        x: 256,
        y: 65,
        fontSize: 22,
        fontFamily: "'Fredoka', sans-serif",
        fill: "#000000",
        stroke: "#000000",
        strokeWidth: 0,
        bubbleStyle: "thought",
        bubbleFill: "#ffffff",
        bubbleStroke: "#3b82f6",
      },
    ],
  },
  {
    id: "shout-burst",
    name: "Shouting Action Burst",
    category: "speech",
    description: "High energy comic shout effect",
    texts: [
      {
        text: "NANI?!?",
        x: 256,
        y: 65,
        fontSize: 40,
        fontFamily: "'Bangers', Impact, cursive",
        fill: "#facc15",
        stroke: "#000000",
        strokeWidth: 9,
        bubbleStyle: "shout",
        bubbleFill: "#dc2626",
        bubbleStroke: "#000000",
      },
    ],
  },
  {
    id: "curved-banner",
    name: "Curved Top Arc",
    category: "classic",
    description: "Arched text framing the sticker top",
    texts: [
      {
        text: "CERTIFIED LEGEND",
        x: 256,
        y: 55,
        fontSize: 32,
        fontFamily: "Anton, Impact, sans-serif",
        fill: "#facc15",
        stroke: "#000000",
        strokeWidth: 7,
        arc: 45,
        isUppercase: true,
      },
    ],
  },
  {
    id: "reaction-bruh",
    name: "Reaction: BRUH",
    category: "reaction",
    description: "Bold single-word reaction caption",
    texts: [
      {
        text: "BRUH 💀",
        x: 256,
        y: 460,
        fontSize: 44,
        fontFamily: "'Bangers', Impact, cursive",
        fill: "#ffffff",
        stroke: "#000000",
        strokeWidth: 10,
        isUppercase: true,
      },
    ],
  },
  {
    id: "reaction-pov",
    name: "Reaction: POV",
    category: "reaction",
    description: "Trending POV reaction badge",
    texts: [
      {
        text: "POV: You just woke up",
        x: 256,
        y: 55,
        fontSize: 26,
        fontFamily: "'Space Grotesk', sans-serif",
        fill: "#ffffff",
        stroke: "#000000",
        strokeWidth: 6,
        bubbleStyle: "badge",
        bubbleFill: "rgba(0, 0, 0, 0.75)",
        bubbleStroke: "#ffffff",
      },
    ],
  },
];

export const QUICK_PUNCHLINES = [
  "BRUH 💀",
  "POV: ME",
  "SEND HELP 🚩",
  "NO CAP 🧢",
  "DELETE THIS 🗑️",
  "REAL 💯",
  "EMOTIONAL DAMAGE",
  "SHEEEESH 🔥",
  "CONFUSED 🤔",
  "BIG MOOD ✨",
];
