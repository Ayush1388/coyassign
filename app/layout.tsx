import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { TabBar } from "@/components/nav/tab-bar";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme-toggle";
import "./globals.css";

const heading = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Coy · Discover",
  description: "Swipe to discover new people. Only mutual likes are ever revealed.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="coy" suppressHydrationWarning className={`${heading.variable} ${body.variable}`}>
      <head>
        {/* Applies the saved theme before first paint, so there's no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col">
          <main className="flex min-h-0 flex-1 flex-col pb-[calc(76px+env(safe-area-inset-bottom))]">{children}</main>
        </div>
        <TabBar />
      </body>
    </html>
  );
}
