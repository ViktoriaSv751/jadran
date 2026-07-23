"use client";

import { useState } from "react";
import { useLang } from "@/lib/store";
import { tr, loc } from "@/lib/i18n";
import type { Lang, CountryCode } from "@/lib/types";
import { COUNTRIES, COUNTRY_BY_CODE } from "@/lib/geo";
import { FOREIGN_BUYER } from "@/lib/legal";
import Icon from "@/components/ui/Icon";

// Minden felület-nyelvet feloldó helper (a `loc()` csak 4 tartalom-nyelvet tud,
// ez viszont a teljes 12 nyelvű felület-fordítást használja, angol fallbackkel).
type GL = Partial<Record<Lang, string>>;
const pick = (o: GL, lang: Lang): string => o[lang] ?? o.en ?? "";

const steps: { title: GL; body: GL }[] = [
  {
    title: { hu: "1. Keresés és válogatás", me: "1. Pretraga i odabir", en: "1. Search & shortlist", ru: "1. Поиск и отбор", sr: "1. Претрага и одабир", bs: "1. Pretraga i odabir", hr: "1. Pretraga i odabir", uk: "1. Пошук і добірка", sq: "1. Kërko dhe përzgjidh", el: "1. Αναζήτηση & προεπιλογή", tr: "1. Arama ve ön seçim", es: "1. Busca y preselección" },
    body: { hu: "Mentsd el a keresést és kövesd a verifikált hirdetéseket. Hasonlíts össze akár 4 ingatlant.", me: "Sačuvajte pretragu i pratite verifikovane oglase. Uporedite do 4 nekretnine.", en: "Save a search and follow verified listings. Compare up to 4 properties.", ru: "Сохраните поиск и следите за проверенными объявлениями. Сравните до 4 объектов.", sr: "Сачувајте претрагу и пратите верификоване огласе. Упоредите до 4 некретнине.", bs: "Sačuvajte pretragu i pratite verifikovane oglase. Uporedite do 4 nekretnine.", hr: "Spremite pretragu i pratite verificirane oglase. Usporedite do 4 nekretnine.", uk: "Збережіть пошук і стежте за перевіреними оголошеннями. Порівняйте до 4 об'єктів нерухомості.", sq: "Ruaj një kërkim dhe ndiq shpalljet e verifikuara. Krahaso deri në 4 prona.", el: "Αποθηκεύστε μια αναζήτηση και παρακολουθήστε επαληθευμένες αγγελίες. Συγκρίνετε έως 4 ακίνητα.", tr: "Bir aramayı kaydedin ve doğrulanmış ilanları takip edin. En fazla 4 mülkü karşılaştırın.", es: "Guarda una búsqueda y sigue los anuncios verificados. Compara hasta 4 inmuebles." }
  },
  {
    title: { hu: "2. Jogi átvilágítás", me: "2. Pravna provjera", en: "2. Legal due diligence", ru: "2. Юридическая проверка", sr: "2. Правна провера", bs: "2. Pravna provjera", hr: "2. Pravna provjera", uk: "2. Юридична перевірка", sq: "2. Kujdesi ligjor (due diligence)", el: "2. Νομικός έλεγχος", tr: "2. Hukuki inceleme", es: "2. Comprobación legal (due diligence)" },
    body: { hu: "Ellenőrizd a tulajdoni lapot a kataszterben. A verifikált jelvényünk azt jelenti, hogy ez már megtörtént.", me: "Provjerite vlasnički list u katastru. Naš verifikovani znak znači da je to već urađeno.", en: "Check the title deed in the cadastre. Our verified badge means this is already done.", ru: "Проверьте право собственности в кадастре. Наш знак проверки означает, что это уже сделано.", sr: "Проверите власнички лист у катастру. Наш верификовани знак значи да је то већ урађено.", bs: "Provjerite vlasnički list u katastru. Naša oznaka verifikacije znači da je to već urađeno.", hr: "Provjerite vlasnički list u katastru. Naša oznaka verifikacije znači da je to već obavljeno.", uk: "Перевірте право власності в кадастрі. Наша позначка «перевірено» означає, що це вже зроблено.", sq: "Kontrollo fletën e pronësisë në kadastër. Shenja jonë e verifikimit do të thotë se kjo është bërë tashmë.", el: "Ελέγξτε τον τίτλο ιδιοκτησίας στο κτηματολόγιο. Η επαληθευμένη σήμανσή μας σημαίνει ότι αυτό έχει ήδη γίνει.", tr: "Tapuyu kadastroda kontrol edin. Doğrulanmış rozetimiz bunun zaten yapıldığı anlamına gelir.", es: "Comprueba la nota simple en el catastro. Nuestro sello de verificado significa que ya está hecho." }
  },
  {
    title: { hu: "3. Foglalás és szerződés", me: "3. Rezervacija i ugovor", en: "3. Reservation & contract", ru: "3. Бронирование и договор", sr: "3. Резервација и уговор", bs: "3. Rezervacija i ugovor", hr: "3. Rezervacija i ugovor", uk: "3. Бронювання і договір", sq: "3. Rezervimi dhe kontrata", el: "3. Κράτηση & συμβόλαιο", tr: "3. Rezervasyon ve sözleşme", es: "3. Reserva y contrato" },
    body: { hu: "Előszerződés a közjegyzőnél, a foglaló általában 10%. Bízz meg ügyvédet a szerződés elkészítésével.", me: "Predugovor kod notara, kapara obično 10%. Angažujte advokata za nacrt.", en: "Preliminary contract at the notary, deposit usually 10%. Engage a lawyer for drafting.", ru: "Предварительный договор у нотариуса, задаток обычно 10%. Привлеките адвоката.", sr: "Предуговор код нотара, капара обично 10%. Ангажујте адвоката за нацрт.", bs: "Predugovor kod notara, kapara obično 10%. Angažujte advokata za izradu nacrta.", hr: "Predugovor kod javnog bilježnika, kapara obično 10 %. Angažirajte odvjetnika za sastavljanje.", uk: "Попередній договір у нотаріуса, завдаток зазвичай 10%. Залучіть адвоката для складання.", sq: "Kontratë paraprake te noteri, kapari zakonisht 10%. Angazho një avokat për hartimin.", el: "Προσύμφωνο στον συμβολαιογράφο, προκαταβολή συνήθως 10%. Αναθέστε τη σύνταξη σε δικηγόρο.", tr: "Noterde ön sözleşme, kapora genellikle %10. Sözleşme taslağı için bir avukatla çalışın.", es: "Contrato preliminar ante notario, señal habitualmente del 10%. Contrata a un abogado para su redacción." }
  }
];

export default function GuidePage() {
  const { lang } = useLang();
  const [open, setOpen] = useState(0);
  const [country, setCountry] = useState<CountryCode>("ME");

  const info = FOREIGN_BUYER[country];
  const taxPct = Math.round(COUNTRY_BY_CODE[country].costs.transferTaxRate * 1000) / 10;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Cím — a kiválasztott ország a cím alatt, jól láthatóan; országfüggő és
          telefonon sem lóg ki (törhető sor, nem csonkolt). */}
      <div className="mb-5">
        <h1 className="flex items-start gap-2 text-2xl font-black leading-tight tracking-tight text-ink-900 sm:text-3xl">
          <Icon name="compass" size={24} className="mt-1 shrink-0 text-brand-500" />
          <span className="min-w-0 break-words">{tr("guide_title", lang)}</span>
        </h1>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-4 py-1.5 text-sm font-bold text-ink-950">
          <span className="text-base leading-none">{COUNTRY_BY_CODE[country].flag}</span>
          {tr(COUNTRY_BY_CODE[country].nameKey, lang)}
        </div>
      </div>

      {/* Ország-választó — a jog/adó/mellékköltség ehhez igazodik. */}
      <div className="mt-5">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500">
          {tr("guide_pick_country", lang)}
        </span>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCountry(c.code)}
              aria-pressed={country === c.code}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
                country === c.code
                  ? "border-ink-950 bg-ink-950 text-white ring-2 ring-brand-300 ring-offset-1"
                  : "border-ink-200 text-ink-700 hover:border-ink-300"
              }`}
            >
              <span className="text-base leading-none">{c.flag}</span>
              {tr(c.nameKey, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Általános folyamat (1–3) + dinamikus adó-lépés (4). */}
      <div className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="flex w-full items-center justify-between p-4 text-left font-semibold text-ink-800"
            >
              {pick(s.title, lang)}
              <span className="text-ink-400">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p className="px-4 pb-4 leading-relaxed text-ink-600">{pick(s.body, lang)}</p>}
          </div>
        ))}

        {/* 4. Adó — országfüggő kulccsal. */}
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
          <button
            onClick={() => setOpen(open === 3 ? -1 : 3)}
            className="flex w-full items-center justify-between p-4 text-left font-semibold text-ink-800"
          >
            {tr("guide_tax_step", lang)}
            <span className="text-ink-400">{open === 3 ? "−" : "+"}</span>
          </button>
          {open === 3 && (
            <div className="px-4 pb-4">
              <div className="mb-3 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">{tr("guide_transfer_tax", lang)}</span>
                <span className="text-lg font-black text-ink-900">{taxPct}%</span>
              </div>
              <p className="leading-relaxed text-ink-600">{tr("guide_tax_body", lang)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Külföldi vásárlóknak — ORSZÁGONKÉNTI infó a lib/legal.ts-ből. */}
      <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <h2 className="flex items-center gap-2 font-bold text-brand-700">
          <span className="text-lg leading-none">{COUNTRY_BY_CODE[country].flag}</span>
          {tr("foreign_title", lang)} · {tr(COUNTRY_BY_CODE[country].nameKey, lang)}
        </h2>
        <p className="mt-2 text-sm text-ink-600">{loc(info.intro, lang)}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-600">
          {info.points.map((p, i) => (
            <li key={i}>{loc(p, lang)}</li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-snug text-ink-400">{tr("foreign_disclaimer", lang)}</p>
      </div>
    </div>
  );
}
