export type NavItem = { name: string; href: string };
export type NavCategory = { name: string; items: NavItem[] };

export const navCategories: NavCategory[] = [
  {
    name: "Gaming Tools",
    items: [
      { name: "Fusion Calculator", href: "/fusion-calculator" },
      { name: "Game of the Year", href: "/game-of-the-year" },
    ],
  },
  {
    name: "Programming Tools",
    items: [{ name: "Random String", href: "/random-string" }],
  },
  {
    name: "Other",
    items: [
      { name: "Smoothie Calculator", href: "/smoothie-calculator" },
      { name: "About Me", href: "/about-me" },
      { name: "Blog", href: "/blog" },
    ],
  },
];
