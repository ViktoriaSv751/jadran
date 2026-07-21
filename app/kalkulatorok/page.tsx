import type { Metadata } from "next";
import { SITE_URL } from "@/lib/supabase-server";
import { breadcrumbJsonLd, SITE_ID } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import PropertyCalculators from "@/components/tools/PropertyCalculators";

const TITLE = "Ingatlan-kalkulátorok: bekerülési költség, Golden Visa és hozam";
const DESC =
  "Ingyenes kalkulátorok külföldi ingatlanvásárláshoz: teljes bekerülési költség országonként, Golden Visa jogosultság-ellenőrző és bérleti hozam számológép.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  keywords: [
    "ingatlan kalkulátor",
    "bekerülési költség kalkulátor",
    "golden visa kalkulátor",
    "bérleti hozam kalkulátor",
    "külföldi ingatlan költség"
  ],
  alternates: { canonical: `${SITE_URL}/kalkulatorok` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/kalkulatorok`, type: "website" }
};

export default function CalculatorsPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: TITLE,
            url: `${SITE_URL}/kalkulatorok`,
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" },
            isPartOf: { "@id": SITE_ID }
          },
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: "Kalkulátorok", url: `${SITE_URL}/kalkulatorok` }
          ])
        ]}
      />
      <PropertyCalculators />
    </>
  );
}
