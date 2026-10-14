import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { ChatProvider } from "@/components/providers/chat-provider";
import { LibraryProvider } from "@/components/providers/library-provider";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: "NEXUS AI — Intelligent Document Assistant", template: "%s · NEXUS AI" },
  description: "Ask questions about your documents and get grounded answers with verifiable citations. A Retrieval-Augmented Generation app.",
};

export const viewport: Viewport = {
  themeColor: "#160d26",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${grotesk.variable} ${jetbrains.variable}`}>
      <body>
        <LibraryProvider>
          <ChatProvider>
            <AppShell>{children}</AppShell>
          </ChatProvider>
        </LibraryProvider>
      </body>
    </html>
  );
}
