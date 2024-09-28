"use client";

import { useState, useEffect } from "react";
import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import smoothieData from "./ingredients.json";

const SmoothieCalculator: React.FC = () => {
  const [inventory, setInventory] = useState<{ [key: string]: boolean }>({});
  const [possibleSmoothies, setPossibleSmoothies] = useState<
    [string, (string | string[])[]][]
  >([]);

  useEffect(() => {
    calculatePossibleSmoothies();
  }, [inventory]);

  const toggleIngredient = (ingredient: string) => {
    setInventory((prev) => ({
      ...prev,
      [ingredient]: !prev[ingredient],
    }));
  };

  const calculatePossibleSmoothies = () => {
    const availableIngredients = Object.keys(inventory).filter(
      (ing) => inventory[ing],
    );
    const possible = Object.entries(smoothieData.smoothies).filter(
      ([, ingredients]) => {
        return ingredients.every((ing) => {
          if (Array.isArray(ing)) {
            return ing.some((option) => availableIngredients.includes(option));
          }
          return availableIngredients.includes(ing);
        });
      },
    );
    setPossibleSmoothies(possible);
  };

  const renderIngredient = (ingredient: string | string[]) => {
    if (Array.isArray(ingredient)) {
      return ingredient.join(" or ");
    }
    return ingredient;
  };

  return (
    <div className="w-full max-w-md p-2 mx-auto bg-white rounded-2xl shadow-md">
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-purple-900 bg-purple-100 rounded-lg hover:bg-purple-200 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
              <span>Select Ingredients</span>
              <ChevronUpIcon
                className={`${
                  open ? "transform rotate-180" : ""
                } w-5 h-5 text-purple-500`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {smoothieData.ingredients.map((ingredient) => (
                  <div key={ingredient} className="flex items-center">
                    <input
                      id={ingredient}
                      type="checkbox"
                      checked={inventory[ingredient] || false}
                      onChange={() => toggleIngredient(ingredient)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor={ingredient}
                      className="ml-2 text-sm font-medium text-gray-900"
                    >
                      {ingredient}
                    </label>
                  </div>
                ))}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <div className="mt-4 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">
          Possible Smoothies:
        </h3>
        {possibleSmoothies.length > 0 ? (
          <ul className="space-y-2">
            {possibleSmoothies.map(([smoothie, ingredients]) => (
              <li key={smoothie} className="bg-white p-2 rounded shadow">
                <span className="font-medium text-gray-900">{smoothie}</span>
                <br />
                <span className="text-sm text-gray-600">
                  {ingredients.map(renderIngredient).join(" + ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">
            No smoothies can be made with the current ingredients.
          </p>
        )}
      </div>
    </div>
  );
};

export default SmoothieCalculator;
