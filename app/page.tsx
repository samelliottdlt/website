import Image from "next/image";
import Link from "next/link";
import "./page.css";
import { categories } from "../lib/navigation";

function Home() {
  return (
    <div className="home-container p-4 space-y-8">
      {categories.map((category) => (
        <section key={category.title}>
          <h2 className="mb-4 text-xl font-semibold">{category.title}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {category.items.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-lg bg-white/70 p-4 text-center font-medium text-gray-800 shadow hover:bg-white"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </section>
      ))}
      <Image
        src="/kiki-fly.svg"
        alt="A flying Kiki"
        className="fixed bottom-2 right-2 w-16"
        width={64}
        height={64}
      />
    </div>
  );
}

export default Home;
