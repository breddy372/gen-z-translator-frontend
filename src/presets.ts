import { PresetPrompt } from "./types";

export const PRESETS: PresetPrompt[] = [
  {
    id: "default",
    name: "Drip & Slay (Default)",
    emoji: "🔥",
    description: "Authentic, high-vibe slang translation fit for daily messaging.",
    prompt:
      "Translate standard English into authentic Gen-Z slang. Preserve meaning while changing tone, vocabulary, and structure. Use contemporary slang (no cap, fr fr, slay, rizz, bussin, glow up, periodt) where appropriate. Return only the translated slang text."
  },
  {
    id: "brainrot",
    name: "Brainrot Overload",
    emoji: "🧠",
    description: "Max volume influencer slang. Pure brainrot.",
    prompt:
      "Translate the text into intense Gen-Z brainrot style. Inject high-energy slang and meme terms while preserving the original meaning. Keep it absurd and expressive. Return only the translated slang text."
  },
  {
    id: "corporate",
    name: "Corporate Gen-Z",
    emoji: "💼",
    description: "Like a tech startup manager trying way too hard.",
    prompt:
      "Blend professional corporate wording with Gen-Z slang: make formal lines sound like trendy, humorous workplace slang while keeping clarity. Return only the translated text."
  },
  {
    id: "sassy",
    name: "Sassy Bestie",
    emoji: "💅",
    description: "Extremely sassy, opinionated, and absolute chief bestie.",
    prompt:
      "Translate into sassy, dramatic bestie vernacular. Use playful shade and phrases like periodt, tea, caught in 4k, she ate and left no crumbs, while preserving meaning. Return only the translation."
  }
];
