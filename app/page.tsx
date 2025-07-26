import Image from "next/image";
import "./page.css";

function Home() {
  return (
    <div className="home-container">
      <h1>Hello, world</h1>
      <Image
        src="/kiki-fly.svg"
        alt="A flying Kiki"
        className="absolute bottom-4 right-4 w-16"
        width={500}
        height={500}
      />
    </div>
  );
}

export default Home;
