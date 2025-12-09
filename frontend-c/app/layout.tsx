import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import "@stackloom/ui/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Stackloom focuses on AI-driven UI building and coding workflows, aiming to accelerate front-end development, align design with implementation, and maintain high reliability and consistent user experience in complex interactions.",
  description:
    "Reinvent UI development with AI. Stackloom makes your coding faster, more accurate, and more delightful—powered by intelligent components and a cohesive design system that drive team collaboration and continuous delivery.",
  keywords: [],
  authors: [{ name: "jerrychir@gmail.com" }],
  creator: "Igor Duspara",
  publisher: "ooiai.com stackloom",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL("https://builder.ooiai.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://builder.ooiai.com",
    siteName: "Stackloom Builder",
    title: "Stackloom Builder - Stackloom focuses on AI-driven UI building",
    description:
      "Reinvent UI development with AI. Stackloom makes your coding faster, more accurate, and more delightful—powered by intelligent components and a cohesive design system that drive team collaboration and continuous delivery.",
    images: [
      {
        url: "/show.png",
        width: 1200,
        height: 630,
        alt: "Stackloom Builder Preview",
      },
    ],
  },
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
        className={cn(fontVariables, "font-sans")}
      >
        {children}
      </body>
    </html>
  );
}
