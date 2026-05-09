import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { InitialAgoraLoader } from "@/components/layout/InitialAgoraLoader";
import { AppToaster } from "@/components/ui/AppToaster";
import { PWARegister } from "@/components/layout/PWARegister";

export const metadata: Metadata = {
  title: "AgoraTask | Service Marketplace",
  description: "AgoraTask helps customers discover trusted specialists for home, learning, wellness, and business support with a cleaner, faster path from search to shortlist.",
  icons: {
    icon: "/agoratask-icon.svg",
    shortcut: "/agoratask-icon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AgoraTask",
  },
};

export const viewport: Viewport = {
  themeColor: "#0067E8",
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
                <PWARegister />
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
