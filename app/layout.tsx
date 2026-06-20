import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";

export const metadata: Metadata = {
  title: "ScanMart AI",
  description: "Turn physical stock into inventory, storefronts, and automated workflows.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning><AppProvider>{children}</AppProvider></body>
    </html>
  );
}



