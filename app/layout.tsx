import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import SideNav from "../components/SideNav";

export const metadata = {
  title: "Sam's Fun House",
  description: "I just put whatever here",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.svg", type: "image/svg+xml", sizes: "16x16" },
      { url: "/favicon-32x32.svg", type: "image/svg+xml", sizes: "32x32" },
    ],
    shortcut: "/favicon.svg",
  },
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
        <div className="flex h-screen overflow-hidden">
          <SideNav />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
      <Analytics />
    </html>
  );
}
