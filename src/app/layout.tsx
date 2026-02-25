import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Gap Radar — Strategic YouTube Opportunity Detection | AuraIQ",
  description:
    "AI Gap Radar analyzes competitor velocity, audience frustration, and topic saturation to reveal high-opportunity YouTube content gaps — before your competitors see them.",
  keywords: [
    "YouTube content gaps",
    "AI content strategy",
    "YouTube SEO",
    "content opportunity detection",
    "Tech YouTube",
    "AI creators",
    "AuraIQ",
  ],
  authors: [{ name: "AuraIQ" }],
  openGraph: {
    title: "AI Gap Radar — Stop Guessing What to Upload Next",
    description:
      "Strategic YouTube opportunity detection for Tech & AI creators. Data-driven gap analysis powered by AI.",
    type: "website",
    siteName: "AuraIQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head />
      <body className="min-h-screen bg-gray-50"><Providers>{children}</Providers></body>
    </html>
  );
}
