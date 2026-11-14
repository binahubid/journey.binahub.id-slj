import type { Metadata } from "next";
import localFont from "next/font/local";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import "./globals.css";

const jakartaSans = localFont({
  src: "../../public/fonts/plus-jakarta-sans/PlusJakartaSans-Variable.ttf",
  weight: "200 800",
  variable: "--font-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spiritual Leadership Journey (SLJ) — BinaHub",
  description: "Mulai uji coba spiritual 14 hari dan lanjutkan perjalanan transformasi bersama BinaJourney.",
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
    apple: "/icons/app-icon.webp",
  },
};

export const viewport = {
  themeColor: "#071A33",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`scroll-smooth ${jakartaSans.variable}`}>
      <body className={`antialiased bg-[#FAF8F4] text-[#0B2C6B] min-h-screen overflow-x-hidden ${jakartaSans.className}`}>
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
