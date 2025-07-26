function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center bg-white p-5">
      <h1 className="text-6xl text-black mb-5">About Me</h1>
      <p className="text-xl text-black mb-2">
        Hello, I&apos;m Sam. I am a software engineer from Puerto Rico. I enjoy
        playing with:
      </p>
      <ul className="list-none text-black text-xl text-center">
        <li className="mb-2">Web Stuff</li>
        <li className="mb-2">Client Side ML</li>
        <li className="mb-2">Rust</li>
        <li className="mb-2">My Dogs</li>
      </ul>
      <br />
      <p className="text-xl text-black mb-2">
        You can reach me at:{" "}
        <a href="mailto:me@sdelatorrebaba.com" className="text-blue-400">
          me@sdelatorrebaba.com
        </a>
      </p>
    </div>
  );
}

export default Page;
