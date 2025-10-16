import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LogProvider } from "../contexts/LogContext";
import { DataSourceProvider } from "../contexts/DataSourceContext";
import { SettingsProvider } from "../contexts/SettingsContext";
import TopLoadingBar from "../components/ui/TopLoadingBar";
import ClientOnly from "../components/providers/ClientOnly";
import TransitionProvider from "../components/providers/TransitionProvider";
import CommandPaletteProvider from "../components/providers/CommandPaletteProvider";
import StatusFooter from "../components/layout/StatusFooter";

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
  title: "LorSync - Data Integration Platform",
  description:
    "A lightweight desktop ETL tool for data ingestion, transformation, and versioning",
  other: {
    "Content-Security-Policy":
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: ws: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http: https:; font-src 'self' data:; connect-src 'self' http: https: ws: wss:;",
  },
};

/**
 * INTEGRATION PATTERNS:
 *
 * Loading Pattern:
 * - All loading.tsx files use StandardLoading component from components/layout/StandardLoading
 * - StandardLoading wraps LoadingState with variant="page"
 * - Design matches error pages with gradient-bg, tangerine spinner icon, and consistent styling
 * - This ensures consistent loading experience across all routes
 *
 * Context Provider Pattern:
 * - Global contexts (Settings, Logs, DataSources) are provided at root level below
 * - Page-specific contexts (Pipelines, Jobs) wrap individual pages for code splitting
 * - Example: PipelineProvider wraps /pipelines/page.tsx, not available globally
 *
 * Error Handling:
 * - Route-level: error.tsx files catch page errors
 * - Component-level: ErrorBoundary component available for critical components
 * - All follow consistent gradient-bg, glass-card styling pattern
 *
 * Layout Pattern:
 * - Most pages: Use PageLayout component for consistent header/navigation
 * - Project pages: Use custom layout with AppSidebar for workspace experience
 * - See INTEGRATION_ANALYSIS.md for detailed documentation
 */

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
                <CommandPaletteProvider>
                  <TransitionProvider>
                    <TopLoadingBar />
                    {children}
                    <StatusFooter />
                  </TransitionProvider>
                </CommandPaletteProvider>
              </DataSourceProvider>
            </LogProvider>
          </SettingsProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
