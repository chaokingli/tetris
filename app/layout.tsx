import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tetris Game",
  description: "A Tetris game built with Next.js and TypeScript",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
