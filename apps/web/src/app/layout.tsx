import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Eventure — Find your next moment",
    template: "%s | Eventure",
  },
  description: "Discover and create memorable events across Indonesia.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteHeader />
          <main>{children}</main>
          <footer className="site-footer">
            <div className="shell site-footer__inner">
              <span>Eventure</span>
              <span>Built for meaningful moments.</span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
