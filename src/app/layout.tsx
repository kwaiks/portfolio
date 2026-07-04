import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kwaiks.xyz"),
  title: "Alexander Jacquelline — Senior Fullstack Engineer · Applied AI",
  description:
    "Senior Fullstack Engineer building revenue-critical systems and production AI (RAG, guardrails, eval). Ask the site's AI assistant anything about my work.",
  keywords: [
    "Applied AI Engineer",
    "Senior Fullstack Engineer",
    "RAG",
    "pgvector",
    "LLM guardrails",
    "Go",
    "TypeScript",
    "PostgreSQL",
  ],
  openGraph: {
    title: "Alexander Jacquelline — Senior Fullstack Engineer · Applied AI",
    description:
      "Revenue-critical systems, shipped. Production AI you can talk to.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} dark`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
