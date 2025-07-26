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
    title: "Personal",
    items: [
      { name: "About Me", href: "/about-me" },
      { name: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Gaming",
    items: [
      { name: "Fusion Calculator", href: "/fusion-calculator" },
      { name: "Game of the Year", href: "/game-of-the-year" },
      { name: "Smoothie Calculator", href: "/smoothie-calculator" }
    ],
  },
  {
    title: "Tools",
    items: [{ name: "Random String", href: "/random-string" }],
  },
];
