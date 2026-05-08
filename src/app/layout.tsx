import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { InitialAgoraLoader } from "@/components/layout/InitialAgoraLoader";
import { AppToaster } from "@/components/ui/AppToaster";

export const metadata: Metadata = {
  title: "AgoraTask | Service Marketplace",
  description: "AgoraTask helps customers discover trusted specialists for home, learning, wellness, and business support with a cleaner, faster path from search to shortlist.",
  icons: {
    icon: "/agoratask-icon.svg",
    shortcut: "/agoratask-icon.svg",
  },
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
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <MessagesProvider>
                <InitialAgoraLoader />
                {children}
                <AppToaster />
              </MessagesProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
