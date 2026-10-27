import type { Metadata, Viewport } from "next";
import { Newsreader } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

/* Display face. Variable with optical sizing, so one file serves a landing
   headline and a widget heading. Loaded through next/font, never a <link>. */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "CreditDash",
  description:
    "Save the cards you own and see which one to use, what credits are left, and whether the annual fee pays for itself.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${newsreader.variable} h-full antialiased`}
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
