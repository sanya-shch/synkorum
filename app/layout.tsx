import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ModalProvider } from "@/providers/modal-provider";
import { Loading } from "@/components/auth/loading";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, BRAND_COLOR } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: BRAND_COLOR,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Suspense fallback={<Loading />}>
          <TooltipProvider delay={100}>
            <Toaster />

            <ModalProvider />

            {children}
          </TooltipProvider>
        </Suspense>
      </body>
    </html>
  );
}
