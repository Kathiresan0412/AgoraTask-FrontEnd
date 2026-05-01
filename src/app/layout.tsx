import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { MessagesProvider } from "@/contexts/MessagesContext";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgoraTask | Sri Lanka's #1 Service Platform",
  description: "AgoraTask helps customers discover trusted specialists for home, learning, wellness, and business support with a cleaner, faster path from search to shortlist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <MessagesProvider>
            {children}
          </MessagesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
