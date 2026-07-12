"use client";

import { useState } from "react";
import { useLang } from "@/lib/store";
import { tr, loc, contentLang } from "@/lib/i18n";

type GL = { hu: string; me: string; en: string; ru: string };

const steps: { title: GL; body: GL }[] = [
  {
    title: {
      hu: "1. Keresés és válogatás",
      me: "1. Pretraga i odabir",
      en: "1. Search & shortlist",
      ru: "1. Поиск и отбор"
    },
    body: {
      hu: "Mentsd el a keresést és kövesd a verifikált hirdetéseket. Hasonlíts össze akár 4 ingatlant.",
      me: "Sačuvajte pretragu i pratite verifikovane oglase. Uporedite do 4 nekretnine.",
      en: "Save a search and follow verified listings. Compare up to 4 properties.",
      ru: "Сохраните поиск и следите за проверенными объявлениями. Сравните до 4 объектов."
    }
  },
  {
    title: {
      hu: "2. Jogi átvilágítás",
      me: "2. Pravna provjera",
      en: "2. Legal due diligence",
      ru: "2. Юридическая проверка"
    },
    body: {
      hu: "Ellenőrizd a tulajdoni lapot a kataszterben. A verifikált jelvényünk azt jelenti, hogy ez már megtörtént.",
      me: "Provjerite vlasnički list u katastru. Naš verifikovani znak znači da je to već urađeno.",
      en: "Check the title deed in the cadastre. Our verified badge means this is already done.",
      ru: "Проверьте право собственности в кадастре. Наш знак проверки означает, что это уже сделано."
    }
  },
  {
    title: {
      hu: "3. Foglalás és szerződés",
      me: "3. Rezervacija i ugovor",
      en: "3. Reservation & contract",
      ru: "3. Бронирование и договор"
    },
    body: {
      hu: "Előszerződés a közjegyzőnél, a foglaló általában 10%. Bízz meg ügyvédet a szerződés elkészítésével.",
      me: "Predugovor kod notara, kapara obično 10%. Angažujte advokata za nacrt.",
      en: "Preliminary contract at the notary, deposit usually 10%. Engage a lawyer for drafting.",
      ru: "Предварительный договор у нотариуса, задаток обычно 10%. Привлеките адвоката."
    }
  },
  {
    title: {
      hu: "4. Adó és tulajdonátruházás",
      me: "4. Porez i prenos",
      en: "4. Tax & transfer",
      ru: "4. Налог и передача"
    },
    body: {
      hu: "Az átírási illeték 3%. A tulajdonjog bejegyzése a kataszterbe a fizetés után történik.",
      me: "Porez na prenos 3%. Upis vlasništva u katastar nakon plaćanja.",
      en: "Transfer tax 3%. Registration of ownership in the cadastre after payment.",
      ru: "Налог на передачу 3%. Регистрация права в кадастре после оплаты."
    }
  }
];

const foreignTrack: { hu: string[]; me: string[]; en: string[]; ru: string[] } = {
  hu: [
    "Külföldiek korlátozás nélkül vásárolhatnak lakást/házat; mezőgazdasági földet cégen keresztül.",
    "Tartózkodáshoz fontold meg a cégalapítást vagy a tartózkodási engedélyt.",
    "Nyiss helyi bankszámlát a fizetéshez és a rezsihez."
  ],
  me: [
    "Stranci mogu kupiti stan/kuću bez ograničenja; poljoprivredno zemljište preko firme.",
    "Za boravak razmislite o registraciji firme ili dozvoli boravka.",
    "Otvorite lokalni bankovni račun za plaćanje i komunalije."
  ],
  en: [
    "Foreigners can buy apartments/houses freely; agricultural land via a company.",
    "For residency, consider company registration or a residence permit.",
    "Open a local bank account for payment and utilities."
  ],
  ru: [
    "Иностранцы могут свободно покупать квартиры/дома; сельхозземлю — через компанию.",
    "Для ВНЖ рассмотрите регистрацию компании или вид на жительство.",
    "Откройте местный банковский счёт для оплаты и коммунальных услуг."
  ]
};

export default function GuidePage() {
  const { lang } = useLang();
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink-900">{tr("guide_title", lang)}</h1>

      <div className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="flex w-full items-center justify-between p-4 text-left font-semibold text-ink-800"
            >
              {loc(s.title, lang)}
              <span className="text-ink-400">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p className="px-4 pb-4 leading-relaxed text-ink-600">{loc(s.body, lang)}</p>}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <h2 className="font-bold text-brand-700">
          {lang === "hu"
            ? "Külföldi vásárlóknak"
            : lang === "me"
              ? "Za strane kupce"
              : lang === "ru"
                ? "Для иностранных покупателей"
                : "For foreign buyers"}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-600">
          {foreignTrack[contentLang(lang)].map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
