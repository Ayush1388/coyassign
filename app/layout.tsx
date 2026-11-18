import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { TabBar } from "@/components/nav/tab-bar";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme-toggle";
import "./globals.css";

// Coy uses one family for every role; hierarchy comes from weight (400-800).
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });

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
    <html lang="en" data-theme="coy" suppressHydrationWarning className={bricolage.variable}>
      <head>
        {/* Applies the saved theme before first paint, so there's no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
          <main className="flex min-h-0 flex-1 flex-col pb-[calc(80px+env(safe-area-inset-bottom))]">{children}</main>
        </div>
        <TabBar />
      </body>
    </html>
  );
}
