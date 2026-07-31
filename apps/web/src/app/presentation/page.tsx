import type { Metadata } from "next";

import { PresentationDeck } from "./presentation-deck";

export const metadata: Metadata = {
  metadataBase: new URL("https://presentation.eventure.cloud"),
  title: "Eventure Mini Project Technical Presentation",
  description:
    "An examiner-focused walkthrough of Eventure's requirements, ownership, architecture, database, API routes, testing, and production evidence.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Eventure Mini Project Technical Presentation",
    description:
      "Review Eventure's shared responsibility, implementation flow, API reference, rubric evidence, and deployed system.",
    url: "/",
    siteName: "Eventure",
    type: "website",
    images: [
      {
        url: "/presentation-og.png",
        width: 1731,
        height: 909,
        alt: "Eventure mini project technical presentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventure Mini Project Technical Presentation",
    description: "A concise, evidence-led technical walkthrough of the Eventure mini project.",
    images: ["/presentation-og.png"],
  },
};

export default function PresentationPage() {
  return <PresentationDeck />;
}
