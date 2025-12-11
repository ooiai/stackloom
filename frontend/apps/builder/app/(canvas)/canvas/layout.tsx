"use client";
import { useBuilderStore } from "@/stores/builder-store";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";

/**
 * Root layout for the canvas app.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const currentTheme = useBuilderStore((state) => state.currentTheme);
  return (
    <Suspense>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
      </ThemeProvider>
      <style id="theme-style">{currentTheme}</style>
    </Suspense>
  );
}
