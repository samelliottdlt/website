export type NavigationItem = {
  name: string;
  href: string;
};

export type NavigationCategory = {
  title: string;
  items: NavigationItem[];
};

export const categories: NavigationCategory[] = [
  {
    title: "Gaming",
    items: [
      { name: "Fusion Calculator", href: "/fusion-calculator" },
      { name: "Game of the Year", href: "/game-of-the-year" },
    ],
  },
  {
    title: "Programming Tools",
    items: [{ name: "Random String", href: "/random-string" }],
  },
  {
    title: "Utilities",
    items: [{ name: "Smoothie Calculator", href: "/smoothie-calculator" }],
  },
  {
    title: "Personal",
    items: [
      { name: "About Me", href: "/about-me" },
      { name: "Blog", href: "/blog" },
    ],
  },
];
