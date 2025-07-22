import Image from "next/image";
import Link from "next/link";
import { navCategories } from "../lib/navigation";
import "./page.css";

function Home() {
  return (
    <div className="home-container p-6">
      <h1 className="text-3xl mb-6 font-bold">Welcome!</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {navCategories.map((category) => (
          <div key={category.name} className="bg-white/20 rounded p-4">
            <h2 className="text-xl mb-2 font-semibold">{category.name}</h2>
            <ul className="space-y-1">
              {category.items.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-blue-200 hover:underline"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Image
        src="/kiki-fly.svg"
        alt="A flying Kiki"
        className="fixed bottom-2 right-2 w-16"
        width={500}
        height={500}
      />
    </div>
  );
}

export default Home;
