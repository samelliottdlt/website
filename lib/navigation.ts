export type NavigationItem = {
  name: string;
  href: string;
  emoji?: string;
};

export type NavigationCategory = {
  title: string;
  emoji?: string;
  items: NavigationItem[];
};

export const categories: NavigationCategory[] = [
  {
    title: "Personal",
    emoji: "👤",
    items: [
      { name: "About Me", href: "/about-me", emoji: "👋" },
      { name: "Blog", href: "/blog", emoji: "📝" },
    ],
  },
  {
    title: "Gaming",
    emoji: "🎮",
    items: [
      { name: "Fusion Calculator", href: "/fusion-calculator", emoji: "⚡" },
      { name: "Game of the Year", href: "/game-of-the-year", emoji: "🏆" },
      { name: "Smoothie Calculator", href: "/smoothie-calculator", emoji: "🥤" },
    ],
  },
  {
    title: "Tools",
    emoji: "🔧",
    items: [{ name: "Random String", href: "/random-string", emoji: "🎲" }],
  },
];

// Utility function to get emoji with fallback
export const getItemEmoji = (item: NavigationItem): string => {
  return item.emoji || item.name.charAt(0).toUpperCase();
};

export const getCategoryEmoji = (category: NavigationCategory): string => {
  return category.emoji || category.title.charAt(0).toUpperCase();
};
