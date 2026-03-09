import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import { validateEnv } from "@/lib/env";
import "./globals.css";

// Validate environment at boot — crashes fast with a readable error on invalid config.
validateEnv();

export const metadata: Metadata = {
  title: "BuyerOS",
  description: "AU-first operating system for buyers agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
