"use client";

import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "../lib/util";
import { navCategories } from "../lib/navigation";

export default function SideNav() {
  const pathName = usePathname();

  const linkClasses = (current: boolean) =>
    classNames(
      current
        ? "bg-gray-900 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white",
      "block px-3 py-2 rounded-md text-sm",
    );

  return (
    <Disclosure as="nav" className="bg-gray-800 min-h-screen">
      {({ open }) => (
        <>
          <div className="sm:hidden p-2 flex items-center justify-between">
            <Disclosure.Button className="text-gray-400 hover:text-white">
              <span className="sr-only">Open main menu</span>
              {open ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </Disclosure.Button>
          </div>
          <div className="hidden sm:block p-4 w-56">
            {navCategories.map((category) => (
              <div key={category.name} className="mb-6">
                <h3 className="text-gray-400 uppercase text-xs font-semibold mb-2">
                  {category.name}
                </h3>
                <ul className="space-y-1">
                  {category.items.map((item) => {
                    const current = pathName === item.href;
                    return (
                      <li key={item.name}>
                        <Link href={item.href} className={linkClasses(current)}>
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <Disclosure.Panel className="sm:hidden p-4">
            {navCategories.map((category) => (
              <div key={category.name} className="mb-4">
                <h3 className="text-gray-400 uppercase text-xs font-semibold mb-2">
                  {category.name}
                </h3>
                {category.items.map((item) => {
                  const current = pathName === item.href;
                  return (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      href={item.href}
                      className={linkClasses(current)}
                    >
                      {item.name}
                    </Disclosure.Button>
                  );
                })}
              </div>
            ))}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
