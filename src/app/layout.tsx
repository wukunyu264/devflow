import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/site";
const themeScript = `(function(){var p;try{p=localStorage.getItem('devflow-theme')}catch(e){}var d=p?p==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'})()`;
export const metadata: Metadata = {
  metadataBase: siteUrl,
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
      <head><script id="devflow-theme" dangerouslySetInnerHTML={{__html:themeScript}} /></head>
      <body>{children}</body>
    </html>
  );
}
