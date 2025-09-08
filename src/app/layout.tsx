import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "../components/Navigation";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import PWARegistration from "../components/PWARegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Weekly Meals Planner",
  description: "Plan your meals for the week, track nutrition, and generate shopping lists.",
  keywords: ["meal planning", "nutrition", "recipes", "weekly planner", "food", "cooking"],
  authors: [{ name: "Weekly Meals Planner" }],
  creator: "Weekly Meals Planner",
  publisher: "Weekly Meals Planner",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Weekly Meals Planner",
    description: "Plan your meals for the week, track nutrition, and generate shopping lists.",
    type: "website",
    locale: "en_US",
    siteName: "Weekly Meals Planner",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weekly Meals Planner",
    description: "Plan your meals for the week, track nutrition, and generate shopping lists.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon.svg", sizes: "32x32", type: "image/svg+xml" },
      { url: "/icons/icon.svg", sizes: "16x16", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
      { url: "/apple-touch-icon.svg", sizes: "152x152", type: "image/svg+xml" },
      { url: "/apple-touch-icon.svg", sizes: "120x120", type: "image/svg+xml" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icons/icon-maskable.svg",
        color: "#3B82F6",
      },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Weekly Meals Planner",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "application-name": "Weekly Meals Planner",
    "msapplication-TileColor": "#3B82F6",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#3B82F6",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="theme-light">{/* Default theme to prevent flash */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="background-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Meals Planner" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Weekly Meals Planner" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            <Navigation />
            {children}
            <PWARegistration />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
