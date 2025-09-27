import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LogProvider } from "../contexts/LogContext";
import { DataSourceProvider } from "../contexts/DataSourceContext";
import { SettingsProvider } from "../contexts/SettingsContext";
import ClientOnly from "../components/providers/ClientOnly";
import TransitionProvider from "../components/providers/TransitionProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manifold - ETL Tool",
  description:
    "A lightweight desktop ETL tool for data ingestion, transformation, and versioning",
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
        className={`${inter.variable} ${jetBrainsMono.variable} font-sans bg-white text-black antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientOnly>
          <SettingsProvider>
            <LogProvider>
              <DataSourceProvider>
                <TransitionProvider>{children}</TransitionProvider>
              </DataSourceProvider>
            </LogProvider>
          </SettingsProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
