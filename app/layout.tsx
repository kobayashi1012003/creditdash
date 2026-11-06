import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "@/components/theme-provider";
import { firstCardScript } from "@/lib/data/first-card";
import { demoBannerScript } from "@/lib/demo-banner";
import { CARD_ART } from "@/data/card-art.generated";
import "./globals.css";

const SITE_DESCRIPTION =
  "Save the cards you own and see which one to use, what credits are left, and whether the annual fee pays for itself.";

export const metadata: Metadata = {
  // The canonical address, so absolute URLs in metadata (share previews,
  // the manifest) name the real domain whichever host served the page.
  // Nothing at runtime depends on it: sign-in uses the page's own origin.
  metadataBase: new URL("https://creditdash.co"),
  // Pages set a short title ("Pricing"); the template adds the name. The
  // home page opts out with `absolute`.
  title: { default: "CreditDash", template: "%s | CreditDash" },
  description: SITE_DESCRIPTION,
  applicationName: "CreditDash",
  // The share image is app/opengraph-image.png (`npm run og-image`); Next
  // adds its tags here. A page that sets its own openGraph replaces this
  // object rather than merging, so the public pages repeat siteName, type
  // and the image. Twitter falls back to each page's openGraph.
  openGraph: {
    type: "website",
    siteName: "CreditDash",
    locale: "en_US",
    title: "CreditDash",
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
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
        {/* Marks <html data-demo> for visitors with no session who have not
            closed the demo banner, so it paints with the page. */}
        <script
          dangerouslySetInnerHTML={{
            __html: demoBannerScript(process.env.NEXT_PUBLIC_SUPABASE_URL),
          }}
        />
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
