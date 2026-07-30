import type { Metadata } from "next";

import { PresentationDeck } from "./presentation-deck";

export const metadata: Metadata = {
  metadataBase: new URL("https://presentation.eventure.cloud"),
  title: "Eventure Project Presentation",
  description:
    "An interactive walkthrough of Eventure's two-person development, architecture, core features, and production evidence.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Eventure Interactive Project Presentation",
    description:
      "Explore Eventure's shared responsibility, architecture, rubric evidence, live API, and deployed product.",
    url: "/",
    siteName: "Eventure",
    type: "website",
    images: [
      {
        url: "/presentation-og.png",
        width: 1731,
        height: 909,
        alt: "Eventure interactive project presentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventure Interactive Project Presentation",
    description: "A live, evidence-led walkthrough of the Eventure mini project.",
    images: ["/presentation-og.png"],
  },
};

export default function PresentationPage() {
  return <PresentationDeck />;
}
