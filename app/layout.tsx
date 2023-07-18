import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "Sam's Fun house",
  description: "I just put whatever here",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
      <Analytics />
    </html>
  );
}
