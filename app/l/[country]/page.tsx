import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COUNTRY_CODES, COUNTRY_BY_CODE, isCountryCode } from "@/lib/geo";
import { SITE_URL, supabaseServer } from "@/lib/supabase-server";
import {
  COUNTRY_SEO,
  breadcrumbJsonLd,
  countryCollectionJsonLd,
  faqJsonLd,
  gvThresholdText,
  transferTaxPct
} from "@/lib/seo";
import { countryArticleSlug } from "@/lib/articles";
import type { CountryCode } from "@/lib/types";
import CountryLanding from "@/components/CountryLanding";
import JsonLd from "@/components/JsonLd";

export function generateStaticParams() {
  return COUNTRY_CODES.map((c) => ({ country: c }));
}

export function generateMetadata({ params }: { params: { country: string } }): Metadata {
  const code = params.country.toUpperCase();
  if (!isCountryCode(code)) return { title: "Proopify" };
  const s = COUNTRY_SEO[code];
  const url = `${SITE_URL}/l/${code}`;
  return {
    title: s.title,
    description: s.desc,
    keywords: s.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${s.title} · Proopify`,
      description: s.desc,
      url,
      type: "website"
    },
    twitter: { card: "summary_large_image", title: s.title, description: s.desc }
  };
}

/** Aktív hirdetések száma az adott országban (a strukturált adathoz). */
async function activeCount(code: CountryCode): Promise<number> {
  if (!supabaseServer) return 0;
  const { count } = await supabaseServer
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("country", code);
  return count ?? 0;
}

export default async function CountryLandingPage({ params }: { params: { country: string } }) {
  const code = params.country.toUpperCase();
  if (!isCountryCode(code)) notFound();

  const seo = COUNTRY_SEO[code];
  const info = COUNTRY_BY_CODE[code];
  const gvText = gvThresholdText(code);
  const count = await activeCount(code);
  const url = `${SITE_URL}/l/${code}`;

  return (
    <>
      <JsonLd
        data={[
          countryCollectionJsonLd(code, count),
          faqJsonLd(seo.faqHu),
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: seo.nameHu, url }
          ])
        ]}
      />

      {/* Interaktív rész (hirdetések, statisztikák, város-chipek). */}
      <CountryLanding country={code} />

      {/* ------------------------------------------------------------------ *
       * SEO / AEO törzsszöveg.
       *
       * Ez SZERVER-oldalon renderelődik, tehát a keresők és az AI-crawlerek
       * JavaScript futtatása nélkül is látják. A fenti hirdetés-rács ehhez
       * képest kliens-oldali, azt egy JS-t nem futtató bot nem olvasná el —
       * ezért kell ide önálló, tényszerű szöveg.
       * ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-3xl px-4 pb-14">
        <div className="rounded-3xl border border-ink-100 bg-white p-7 shadow-soft">
          <h2 className="display text-2xl text-ink-900">
            Ingatlanbefektetés {seo.inHu} — amit tudni érdemes
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{seo.introHu}</p>

          <ul className="mt-5 space-y-2">
            {seo.highlightsHu.map((h, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-900" />
                <span>{h}</span>
              </li>
            ))}
          </ul>

          {/* Gyors ténytáblázat — az LLM-ek ezt tudják a legkönnyebben kinyerni. */}
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                Átírási adó
              </dt>
              <dd className="mt-1 text-lg font-black text-ink-900">{transferTaxPct(code)}</dd>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                Pénznem
              </dt>
              <dd className="mt-1 text-lg font-black text-ink-900">{info.currency}</dd>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                Aktív hirdetés
              </dt>
              <dd className="mt-1 text-lg font-black text-ink-900">{count}</dd>
            </div>
          </dl>

          {gvText && (
            <p className="mt-5 rounded-2xl border-2 border-ink-950 bg-[#c8ff00]/20 p-4 text-[15px] font-medium leading-relaxed text-ink-900">
              <strong>
                {info.goldenVisa!.kind === "citizenship" ? "Állampolgárság" : "Golden Visa"}:
              </strong>{" "}
              {seo.inHu} {gvText}.{" "}
              <Link href={`/tudastar/${countryArticleSlug(code)}`} className="underline">
                Részletek a kalauzban →
              </Link>
            </p>
          )}

          {/* Angol nyelvű összefoglaló: a nemzetközi keresésekhez és az
              angolul kérdező AI-asszisztensekhez. */}
          <div className="mt-6 border-t border-ink-100 pt-5" lang="en">
            <h3 className="text-sm font-bold uppercase tracking-wide text-ink-500">In English</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-700">{seo.introEn}</p>
          </div>
        </div>

        {/* GYIK — a FAQPage strukturált adat látható párja. */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-ink-900">Gyakori kérdések — {seo.nameHu}</h2>
          <div className="mt-4 space-y-3">
            {seo.faqHu.map((f, i) => (
              <details
                key={i}
                open={i === 0}
                className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"
              >
                <summary className="cursor-pointer text-[15px] font-bold text-ink-900">
                  {f.q}
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href={`/tudastar/${countryArticleSlug(code)}`}
            className="text-sm font-semibold text-ink-900 underline underline-offset-4"
          >
            Teljes országkalauz: ingatlanvásárlás {seo.inHu} →
          </Link>
        </div>
      </section>
    </>
  );
}
