export type NavigationItem = {
  name: string;
  href: string;
  emoji?: string;
};

export type NavigationCategory = {
  title: string;
  items: NavigationItem[];
};

export const categories: NavigationCategory[] = [
  {
    title: "Personal",
    items: [
      { name: "About Me", href: "/about-me", emoji: "👋" },
      { name: "Blog", href: "/blog", emoji: "📝" },
    ],
  },
  {
    title: "Gaming",
    items: [
      { name: "Fusion Calculator", href: "/fusion-calculator", emoji: "⚡" },
      { name: "Game of the Year", href: "/game-of-the-year", emoji: "🏆" },
      {
        name: "Smoothie Calculator",
        href: "/smoothie-calculator",
        emoji: "🥤",
      },
      {
        name: "Wordle Art",
        href: "/wordle-art",
        emoji: "🟩",
      },
    ],
  },
  {
    title: "Tools",
    items: [
      { name: "Random String", href: "/random-string", emoji: "🎲" },
      {
        name: "UTF-8 Length and Byte Count",
        href: "/string-length",
        emoji: "🔤",
      },
      {
        name: "Sequencer",
        href: "/music-sequencer",
        emoji: "🎶",
      },
    ],
  },
];

// Utility function to get emoji with fallback
export const getItemEmoji = (item: NavigationItem): string => {
  return item.emoji || item.name.charAt(0).toUpperCase();
};
