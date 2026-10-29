import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "@/components/theme-provider";
import { firstCardScript } from "@/lib/data/first-card";
import { CARD_ART } from "@/data/card-art.generated";
import "./globals.css";

export const metadata: Metadata = {
  // The canonical address, so absolute URLs in metadata (share previews,
  // the manifest) name the real domain whichever host served the page.
  // Nothing at runtime depends on it: sign-in uses the page's own origin.
  metadataBase: new URL("https://creditdash.co"),
  title: "CreditDash",
  description:
    "Save the cards you own and see which one to use, what credits are left, and whether the annual fee pays for itself.",
  // iOS ignores most of the manifest and reads these instead when the app
  // is added to the home screen.
  appleWebApp: {
    capable: true,
    title: "CreditDash",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#12110f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} h-full antialiased`}
    >
      <head>
        {/*
          OpenNext bundles the server with esbuild `keepNames`, which rewrites
          next-themes' pre-hydration inline script to call `__name()`. That
          helper only exists in the bundle, not in the page, so without this
          shim the script throws and the theme class is not applied until
          React hydrates, giving a flash of the wrong theme on every load.
          Must run before the themes script, so it stays first in <head>.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: "globalThis.__name||=function(f){return f};",
          }}
        />
        {/* Marks the wallet's first card on <html> before the app starts,
            so the Wallet skeleton can paint its art straight away. A few
            hundred bytes; see lib/data/first-card.ts. */}
        <script dangerouslySetInnerHTML={{ __html: firstCardScript(CARD_ART) }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
