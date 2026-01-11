import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Navigation } from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketing AI Agents",
  description: "Multi-agent system for marketing strategy and content creation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <main>{children}</main>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
