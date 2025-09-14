import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LogProvider } from "../contexts/LogContext";
import ClientOnly from "../components/providers/ClientOnly";
import TransitionProvider from "../components/providers/TransitionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manifold - Data Integration Platform",
  description:
    "A powerful, context-agnostic desktop application for data integration and consolidation",
  other: {
    "Content-Security-Policy":
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: ws: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http: https:; font-src 'self' data:; connect-src 'self' http: https: ws: wss:;",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientOnly>
          <LogProvider>
            <TransitionProvider>{children}</TransitionProvider>
          </LogProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
