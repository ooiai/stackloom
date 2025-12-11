import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AlertDialogProvider } from "@/providers/dialog-providers";
import { Toaster } from "@stackloom/ui/components/sonner";
import "@stackloom/ui/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Stackloom enhances the UI design-to-code pipeline with AI, delivering end-to-end support from component generation to page orchestration, so teams can ship modern interfaces faster and with higher quality.",
  description:
    "Reinvent UI development with AI. Stackloom makes your coding faster, more accurate, and more delightful—powered by intelligent components and a cohesive design system that drive team collaboration and continuous delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        className={cn(fontVariables, "antialiased font-sans")}
      >
        <AlertDialogProvider>{children}</AlertDialogProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
