"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "../lib/navigation";
import { classNames } from "../lib/util";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 bg-gray-100 p-4 space-y-4 overflow-y-auto">
      {categories.map((category) => (
        <div key={category.title}>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            {category.title}
          </h3>
          <ul className="space-y-1">
            {category.items.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={classNames(
                    pathname === item.href
                      ? "text-indigo-600 font-medium"
                      : "text-gray-600 hover:text-indigo-600",
                    "block px-2 py-1 text-sm rounded",
                  )}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
