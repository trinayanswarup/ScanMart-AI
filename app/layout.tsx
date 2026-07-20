import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/inter";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { RouterProgressBar } from "@/components/router-progress-bar";

export const metadata: Metadata = {
  title: "ScanMart AI",
  description: "Turn physical stock into inventory, storefronts, and automated workflows.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AppProvider>
            <RouterProgressBar />
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
