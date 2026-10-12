import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./AppShell";
import { LanguageProvider } from "../lib/LanguageProvider";

export const metadata: Metadata = {
  title: "Project Logistics",
  description: "AI-Powered Trucking Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  );
}