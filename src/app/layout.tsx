import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>
          <AuthProvider>
            <MessagesProvider>
              {children}
            </MessagesProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
