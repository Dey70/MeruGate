import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeeruGate",
  description: "Study tracker for GATE CSE exam prep with social accountability.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets fixed elements (bottom tab bar) sit under the iPhone notch/home
  // indicator so we can pad around them with env(safe-area-inset-*).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
