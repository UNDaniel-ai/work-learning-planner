import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Work & Learning Planner",
  description: "Personal planning for work, learning, time blocks, and reviews."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
