import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "KanColle Hub",
  description: "只给几个人用的一站式工具吧大概",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
