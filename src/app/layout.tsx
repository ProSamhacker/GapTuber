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
  title: "GapTuber — YouTube Content Gap Detection | AurionStack",
  description:
    "GapTuber uses statistical algorithms and AI to detect high-opportunity YouTube content gaps before your competitors — powered by AurionStack.",
  keywords: [
    "YouTube content gaps",
    "AI content strategy",
    "YouTube SEO",
    "content opportunity detection",
    "GapTuber",
    "AurionStack",
    "YouTube gap analysis",
  ],
  authors: [{ name: "AurionStack" }],
  openGraph: {
    title: "GapTuber — Stop Guessing What to Upload Next",
    description:
      "Strategic YouTube content gap detection for creators. Data-driven opportunity analysis powered by AI.",
    type: "website",
    siteName: "GapTuber",
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
      <body className="min-h-screen bg-[#0a0a0f]"><Providers>{children}</Providers></body>
    </html>
  );
}
