import type { Metadata } from "next";
import "../docs/styles.css";

export const metadata: Metadata = {
  title: "马略卡高尔夫月住计划",
  description:
    "2026 年 12 月至 2027 年 1 月马略卡高尔夫月住计划，每日更新航班、住宿、高尔夫和租车建议。",
  openGraph: {
    title: "马略卡高尔夫月住计划",
    description: "30 天 · ARN → PMI · 每日更新",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
