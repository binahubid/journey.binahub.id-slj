import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spiritual Leadership Journey (SLJ) — BinaHub",
  description: "Platform digital pendamping program transformasi 90 hari BinaJourney.",
  manifest: "/manifest.webmanifest",
  applicationName: "SLJ BinaJourney",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SLJ",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/journey-icon.webp",
    apple: "/icons/journey-icon.webp",
  },
};

export const viewport = {
  themeColor: "#071A33",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`scroll-smooth ${jakartaSans.variable} ${inter.variable}`}>
      <body className={`antialiased bg-[#FAF8F4] text-[#0B2C6B] min-h-screen ${jakartaSans.className}`}>
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
