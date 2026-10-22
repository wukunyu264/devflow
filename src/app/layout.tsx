import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "DevFlow — 开发者灵感社区", template: "%s · DevFlow" },
  description:
    "让技术沉淀，让灵感流动。发现优质的开发者内容，分享技术经验，与志同道合的人一起成长。",
  keywords: [
    "开发者社区",
    "技术博客",
    "React",
    "Next.js",
    "人工智能",
    "DevFlow",
  ],
  applicationName: "DevFlow",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#087f72",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
