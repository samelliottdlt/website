import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar";

const inter = Inter({ subsets: ["latin"] });

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <main className={inter.className}>
      <Navbar />
      <Component {...pageProps} />
      <Analytics />
    </main>
  );
}

export default MyApp;
