import type { CountryCode } from "./types";
import { COUNTRY_BY_CODE, COUNTRIES } from "./geo";
import { SITE_URL } from "./supabase-server";

/**
 * SEO / AEO tartalomréteg.
 *
 * Két célja van:
 *  1. KLASSZIKUS SEO (Google): országonként egyedi, kulcsszó-gazdag, ténysúlyos
 *     szöveg + strukturált adat (JSON-LD), hogy az ország-landingek és a cikkek
 *     önálló találatként rangsoroljanak.
 *  2. AEO / GEO (ChatGPT, Claude, Perplexity, AI Overviews): az LLM-ek a
 *     TÉNYSŰRŰ, jól tagolt, kérdés-válasz formájú szöveget tudják kivonatolni és
 *     idézni. Ezért minden országhoz konkrét számok (küszöb, adó, folyamat-idő)
 *     és rövid, önmagában is megálló válaszok tartoznak.
 *
 * FONTOS: a számokat NEM írjuk le kézzel kétszer — a küszöb és az adókulcs a
 * lib/geo.ts-ből jön, így nem tud elcsúszni a két forrás.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export interface CountrySeo {
  /** Angol országnév (a nemzetközi kulcsszavakhoz). */
  name: string;
  /** Magyar országnév (a hazai kulcsszavakhoz). */
  nameHu: string;
  /** Helyhatározós alak — a magyar toldalékolás nem szabályos, ezért kézzel. */
  inHu: string;
  /** Meta title alap (angol — a legszélesebb elérésért). */
  title: string;
  /** Meta description (angol, ~155 karakter). */
  desc: string;
  /** Magyar bevezető — a landing crawl-olható törzsszövege. */
  introHu: string;
  /** Angol bevezető. */
  introEn: string;
  /** Rövid, tényszerű kiemelések (magyarul) — listaként renderelve. */
  highlightsHu: string[];
  /** Célzott kulcsszavak (HU + EN vegyesen). */
  keywords: string[];
  /** Országspecifikus GYIK — ez adja a FAQPage JSON-LD-t. */
  faqHu: FaqItem[];
}

/** Az adókulcs százalékos szövege az egyetlen igazságforrásból (geo.ts). */
export const transferTaxPct = (c: CountryCode): string => {
  const r = COUNTRY_BY_CODE[c].costs.transferTaxRate;
  return r === 0 ? "0%" : `${Math.round(r * 1000) / 10}%`;
};

/** A Golden Visa / állampolgársági küszöb szövege (geo.ts alapján). */
export const gvThresholdText = (c: CountryCode): string | null => {
  const gv = COUNTRY_BY_CODE[c].goldenVisa;
  if (!gv) return null;
  const eur = new Intl.NumberFormat("hu-HU").format(gv.minEur);
  return gv.kind === "citizenship"
    ? `${eur} € felett állampolgárság igényelhető`
    : `${eur} € felett letelepedési engedély (Golden Visa) igényelhető`;
};

export const COUNTRY_SEO: Record<CountryCode, CountrySeo> = {
  ME: {
    name: "Montenegro",
    nameHu: "Montenegró",
    inHu: "Montenegróban",
    title: "Property for sale in Montenegro",
    desc: "Verified apartments, villas and houses for sale in Montenegro — Budva, Kotor, Tivat and the Adriatic coast. Transparent prices, map search, 3% transfer tax.",
    introHu:
      "Montenegró az Adria egyik legkedvezőbb árfekvésű tengerparti piaca: euróval fizet, az ingatlanátírási adó mindössze 3%, és a külföldi vevő gyakorlatilag ugyanolyan jogokkal vásárolhat lakást vagy házat, mint a helyiek. A kereslet gerincét Budva, Kotor, Tivat (Porto Montenegro) és Herceg Novi adja; a Boka Kotorska öböl tengerre néző lakásai a legkeresettebb befektetési termékek, míg Bar és Ulcinj még mindig lényegesen olcsóbb belépőt kínál. Az ország EU-tagjelölt, ami hosszú távon árfelhajtó tényező.",
    introEn:
      "Montenegro is one of the most affordable coastal markets on the Adriatic: it uses the euro, property transfer tax is just 3%, and foreign buyers can purchase apartments and houses on essentially the same terms as locals. Demand centres on Budva, Kotor, Tivat (Porto Montenegro) and Herceg Novi.",
    highlightsHu: [
      "Hivatalos fizetőeszköz az euró — nincs árfolyamkockázat a vételárban",
      "Ingatlanátírási adó 3%, az egyik legalacsonyabb a régióban",
      "Külföldi magánszemély szabadon vehet lakást és házat (mezőgazdasági földre korlátozás)",
      "EU-tagjelölt ország — hosszú távú felértékelődési potenciál"
    ],
    keywords: [
      "ingatlan Montenegró",
      "montenegrói ingatlanbefektetés",
      "eladó lakás Budva",
      "Kotor ingatlan",
      "Montenegro real estate",
      "property for sale Montenegro",
      "nekretnine Crna Gora"
    ],
    faqHu: [
      {
        q: "Vehet külföldi ingatlant Montenegróban?",
        a: "Igen. Külföldi magánszemély szabadon vásárolhat lakást, házat és építési telket Montenegróban, saját néven, külön engedély nélkül. Korlátozás elsősorban a mezőgazdasági és erdőterületekre vonatkozik — ezeket jellemzően helyi cégen keresztül szokás megvenni."
      },
      {
        q: "Mennyi az ingatlanvásárlás mellékköltsége Montenegróban?",
        a: "Használt ingatlannál 3% átírási adó, ehhez jön kb. 0,5% közjegyzői díj, kb. 1% ügyvédi díj és jellemzően 3% ingatlanközvetítői jutalék. Összességében a vételár 5–8%-ával érdemes számolni."
      },
      {
        q: "Ad Montenegró tartózkodási engedélyt ingatlanvásárlásért?",
        a: "Montenegró ingatlantulajdon alapján ideiglenes tartózkodási engedélyt biztosít, amelyet évente meg kell újítani. A korábbi állampolgárság-befektetési program 2022 végén lezárult, tehát ma Montenegróban ingatlannal állampolgárságot nem lehet szerezni — erre az EU-n kívül Saint Kitts és Nevis, az EU-hoz közel pedig Törökország kínál utat."
      }
    ]
  },
  HR: {
    name: "Croatia",
    nameHu: "Horvátország",
    inHu: "Horvátországban",
    title: "Property for sale in Croatia",
    desc: "Verified real estate for sale in Croatia — Dubrovnik, Split, Rovinj, Istria and the Adriatic islands. EU member, euro currency, 3% transfer tax.",
    introHu:
      "Horvátország az Adria érett, EU-tagállami piaca: 2023 óta euróövezeti és schengeni tag, ami a magyar és más EU-s vevők számára a legkisebb jogi súrlódású tengerparti vásárlást jelenti. EU-állampolgár magánszemélyként a helyiekkel azonos feltételekkel vásárolhat — nincs szükség a külföldieknél korábban kötelező minisztériumi engedélyre. Isztria (Rovinj, Poreč) a városközeli, Dalmácia (Split, Trogir, Šibenik) a nyaraló-, Dubrovnik pedig a prémium szegmens motorja. A turisztikai bérbeadás hozama a szezonalitás miatt magas, de erősen nyár-koncentrált.",
    introEn:
      "Croatia is the mature, EU-member market on the Adriatic — in the eurozone and Schengen since 2023. EU citizens buy on the same terms as locals, with no ministry permit required. Istria, Dalmatia and Dubrovnik lead demand.",
    highlightsHu: [
      "EU- és euróövezeti tagállam — EU-állampolgárnak nincs engedélykötelezettség",
      "Ingatlanátírási adó 3% (új építésű, ÁFÁ-s ingatlannál nincs átírási adó)",
      "Erős, de erősen szezonális rövid távú bérbeadási piac",
      "Schengen — szabad beutazás és tartózkodás EU-s vevőknek"
    ],
    keywords: [
      "ingatlan Horvátország",
      "horvát tengerparti ingatlan",
      "eladó nyaraló Horvátország",
      "Croatia real estate",
      "property for sale Croatia",
      "nekretnine Hrvatska",
      "Isztria ingatlan"
    ],
    faqHu: [
      {
        q: "Vehet magyar állampolgár ingatlant Horvátországban?",
        a: "Igen, korlátozás nélkül. Mivel Magyarország és Horvátország is EU-tagállam, a magyar magánszemély a horvát állampolgárokkal azonos feltételekkel, saját néven vásárolhat lakást vagy házat — a korábban kötelező külügyminisztériumi engedélyre nincs szükség. Kivétel a mezőgazdasági föld, amelyre továbbra is korlátozás él."
      },
      {
        q: "Mennyi adót kell fizetni horvát ingatlanvásárláskor?",
        a: "Használt ingatlan vételekor 3% ingatlanátírási adót (porez na promet nekretnina) fizet a vevő. Új építésű, fejlesztőtől vásárolt ingatlannál nincs átírási adó, mert az árban ÁFA szerepel. Ehhez jön kb. 0,4% közjegyzői díj, ügyvédi díj és jellemzően 3% közvetítői jutalék."
      },
      {
        q: "Megéri Horvátországban rövid távú bérbeadásra ingatlant venni?",
        a: "A dalmát és isztriai parton a nyári hozam kiemelkedő, de a szezon jellemzően 3–4 hónapra korlátozódik, és a turisztikai bérbeadáshoz kategóriába sorolás (rješenje o kategorizaciji) és átalányadó szükséges. Éves szinten a nettó hozam jellemzően 3–5% között alakul."
      }
    ]
  },
  AL: {
    name: "Albania",
    nameHu: "Albánia",
    inHu: "Albániában",
    title: "Property for sale in Albania",
    desc: "Verified property on the Albanian Riviera — Sarandë, Vlorë, Ksamil, Durrës. Europe's cheapest seafront entry point, 0% transfer tax, strong rental yields.",
    introHu:
      "Albánia a Földközi-tenger legalacsonyabb belépési küszöbű tengerparti piaca: az Albán Riviérán (Sarandë, Ksamil, Himarë) a tengerre néző új építésű lakások négyzetméterára még mindig töredéke a horvát vagy görög árakénak, miközben Korfu és a görög határ karnyújtásnyira van. Ingatlanátírási adó gyakorlatilag nincs, a külföldi vevő pedig saját néven vásárolhat lakást. A turizmus az elmúlt években rekordütemben nőtt, ami a rövid távú bérbeadási hozamot a régió élmezőnyébe emelte — cserébe a piac fiatalabb, a jogi átvilágítás (tulajdoni lap, építési engedély) itt különösen fontos.",
    introEn:
      "Albania offers the lowest seafront entry price in the Mediterranean. The Albanian Riviera — Sarandë, Ksamil, Himarë — combines new-build sea-view apartments at a fraction of Croatian or Greek prices with record tourism growth and effectively no transfer tax.",
    highlightsHu: [
      "A régió legalacsonyabb tengerparti négyzetméterárai",
      "Ingatlanátírási adó gyakorlatilag 0% a vevő oldalán",
      "Külföldi magánszemély saját néven vehet lakást",
      "Kiemelkedő rövid távú bérbeadási hozam a gyorsan növekvő turizmus miatt"
    ],
    keywords: [
      "ingatlan Albánia",
      "albán riviéra ingatlan",
      "eladó lakás Sarandë",
      "Ksamil ingatlan",
      "Albania real estate",
      "property for sale Albania",
      "cheap seafront property Europe"
    ],
    faqHu: [
      {
        q: "Biztonságos Albániában ingatlant venni külföldiként?",
        a: "Jogilag igen — külföldi magánszemély saját néven vásárolhat lakást, és a tulajdon a kataszterben (ASHK) bejegyezhető. A kockázat nem a tulajdonszerzésben, hanem a tulajdoni háttérben van: az albán piacon fordulnak elő rendezetlen jogcímű vagy engedély nélkül épült ingatlanok, ezért független ügyvéddel végzett átvilágítás nélkül itt semmiképp ne fizessen foglalót."
      },
      {
        q: "Mennyibe kerül egy tengerparti lakás Albániában?",
        a: "Ksamilban és Sarandëban az új építésű, tengerre néző lakások jellemzően 1 200–2 200 €/m² sávban mozognak, Vlorában és Durrësban ennél is olcsóbban lehet belépni. Ez nagyságrendileg fele-harmada a hasonló horvát vagy görög kínálatnak."
      },
      {
        q: "Ad Albánia tartózkodási engedélyt ingatlanvásárlásért?",
        a: "Albániának nincs klasszikus Golden Visa programja, de az ingatlantulajdon megkönnyíti a tartózkodási engedély megszerzését, és az ország vízummentes tartózkodást biztosít számos állampolgárnak évi akár 90 napon túl is. Letelepedésre épülő befektetési programot Görögország, Spanyolország vagy Magyarország kínál, állampolgárságot ingatlannal Törökország és Saint Kitts és Nevis."
      }
    ]
  },
  RS: {
    name: "Serbia",
    nameHu: "Szerbia",
    inHu: "Szerbiában",
    title: "Property for sale in Serbia",
    desc: "Verified apartments and investment property in Serbia — Belgrade, Novi Sad, Zlatibor and Kopaonik. Growing capital market with strong long-let yields.",
    introHu:
      "Szerbia elsősorban városi bérbeadási piac, nem tengerparti nyaralópiac. Belgrád (különösen Belgrade Waterfront, Vračar, Novi Beograd) és Újvidék lakáspiacát az erős belső migráció, a növekvő IT-szektor és a nagy számban érkező külföldi munkavállalók tartják feszesen — ez stabil, egész éves hosszú távú bérleti keresletet jelent, szemben az adriai piacok szezonalitásával. A hegyi üdülőhelyek (Zlatibor, Kopaonik) a kétszezonos apartmanbefektetés terepe. Az átírási adó 2,5%, új építésűnél ÁFA váltja ki.",
    introEn:
      "Serbia is an urban rental market rather than a holiday-home market. Belgrade and Novi Sad combine strong internal migration and a growing IT sector with year-round long-let demand, while Zlatibor and Kopaonik serve the two-season mountain apartment segment.",
    highlightsHu: [
      "Egész éves, nem szezonális bérleti kereslet Belgrádban és Újvidéken",
      "Ingatlanátírási adó 2,5% használt ingatlanra",
      "Külföldi vevő viszonosság alapján vásárolhat — magyar állampolgárra ez teljesül",
      "Kétszezonos hegyi apartmanpiac (Zlatibor, Kopaonik)"
    ],
    keywords: [
      "ingatlan Szerbia",
      "belgrádi lakás eladó",
      "Újvidék ingatlan",
      "Serbia real estate",
      "property for sale Belgrade",
      "nekretnine Srbija",
      "Zlatibor apartman"
    ],
    faqHu: [
      {
        q: "Vehet magyar állampolgár ingatlant Szerbiában?",
        a: "Igen. Szerbia viszonosság alapján engedi a külföldi magánszemélyek ingatlanszerzését, és Magyarországgal ez a viszonosság fennáll, így magyar állampolgár saját néven vásárolhat lakást vagy házat. Mezőgazdasági földre a korlátozás továbbra is él."
      },
      {
        q: "Mekkora bérleti hozamot lehet elérni Belgrádban?",
        a: "A belgrádi hosszú távú lakáskiadás bruttó hozama jellemzően 4–6% között alakul, ami magasabb, mint a legtöbb EU-s fővárosban, és a kereslet egész éves — nem függ a turisztikai szezontól."
      },
      {
        q: "Mennyi az ingatlanvásárlás költsége Szerbiában?",
        a: "Használt ingatlannál 2,5% átírási adó (porez na prenos apsolutnih prava), új építésűnél helyette 10% ÁFA szerepel az árban. Ehhez jön kb. 0,5% közjegyzői díj, ügyvédi díj és jellemzően 3% közvetítői jutalék."
      }
    ]
  },
  TR: {
    name: "Turkey",
    nameHu: "Törökország",
    inHu: "Törökországban",
    title: "Property for sale in Turkey — citizenship eligible",
    desc: "Verified property for sale in Turkey — Istanbul, Antalya, Bodrum, Alanya. Real estate from USD 400,000 qualifies for Turkish CITIZENSHIP in 3–6 months.",
    introHu:
      "Törökország a világ legnagyobb volumenű, ingatlanalapú állampolgársági programját működteti: 400 000 USD értékű ingatlan megvásárlása és három évig tartó megtartása mellett a befektető és a családja török ÁLLAMPOLGÁRSÁGOT — nem csak tartózkodási engedélyt — kaphat, jellemzően 3–6 hónap alatt, tartózkodási kötelezettség nélkül. A török útlevél vízummentes belépést ad több mint 110 országba, és utat nyit az USA E-2 befektetői vízumához. A piac két lába: Isztambul (városi bérbeadás és értéknövekedés) és a mediterrán part (Antalya, Alanya, Bodrum, Fethiye) nyaraló- és bérbeadási céllal. Az átírási adó 4%, a vételár devizás rögzítése kötelező a programban.",
    introEn:
      "Turkey runs the world's highest-volume real-estate citizenship programme: buying USD 400,000 of property and holding it for three years grants the investor and family full Turkish CITIZENSHIP — not just residence — typically in 3–6 months, with no residence requirement.",
    highlightsHu: [
      "400 000 USD ingatlanvásárlás → török ÁLLAMPOLGÁRSÁG 3–6 hónap alatt",
      "Nincs tartózkodási, nyelvi vagy letelepedési kötelezettség",
      "A teljes család (házastárs + 18 alatti gyermekek) bevonható",
      "Az ingatlant 3 évig meg kell tartani, utána szabadon értékesíthető",
      "Vízummentes belépés 110+ országba; út az USA E-2 vízumhoz"
    ],
    keywords: [
      "török állampolgárság ingatlanbefektetéssel",
      "állampolgárság ingatlanvásárlással",
      "ingatlan Törökország",
      "Turkey citizenship by investment",
      "property for sale Turkey",
      "Antalya ingatlan",
      "isztambuli lakás eladó"
    ],
    faqHu: [
      {
        q: "Hogyan lehet ingatlanvásárlással török állampolgárságot szerezni?",
        a: "Legalább 400 000 USD értékű török ingatlant kell megvásárolni, hivatalos értékbecsléssel alátámasztva, és vállalni kell, hogy három évig nem adja el (ezt a tulajdoni lapra is rávezetik). Ezután benyújtható a tartózkodási engedély és az állampolgársági kérelem; a teljes eljárás jellemzően 3–6 hónap, és kiterjed a házastársra és a 18 év alatti gyermekekre is."
      },
      {
        q: "Kell Törökországban élni az állampolgárság megszerzéséhez?",
        a: "Nem. A török befektetői állampolgársági programnak nincs tartózkodási, nyelvi vagy vizsgakötelezettsége — nem kell az országba költözni, sőt a kérelem nagy része meghatalmazott ügyvéddel intézhető."
      },
      {
        q: "Eladhatom az ingatlant az állampolgárság megszerzése után?",
        a: "Igen, de csak a kötelező hároméves megtartási idő letelte után. Az állampolgárság ezután is megmarad — a török állampolgárságot nem vonják vissza az ingatlan eladása miatt."
      },
      {
        q: "Mennyi az ingatlanvásárlás mellékköltsége Törökországban?",
        a: "4% tapu (átírási) illeték, kb. 0,5% közjegyzői és fordítási díj, ügyvédi díj kb. 1,2%, valamint jellemzően 2% közvetítői jutalék. Az állampolgársági programnál ehhez jönnek a kötelező értékbecslés és a hatósági eljárási díjak."
      }
    ]
  },
  ID: {
    name: "Indonesia",
    nameHu: "Bali (Indonézia)",
    inHu: "Balin",
    title: "Property for sale in Bali, Indonesia",
    desc: "Leasehold and freehold villas in Bali — Canggu, Seminyak, Ubud, Uluwatu. Among the world's highest short-let rental yields, 25-year leasehold structures.",
    introHu:
      "Bali a világ egyik legmagasabb rövid távú bérbeadási hozamú piaca: Canggu, Seminyak és Uluwatu villáinál a bruttó hozam nem ritkán eléri a 10–15%-ot, mert a sziget egész évben telt házas és a napi díjak dollár-alapúak. A kulcskérdés a tulajdonforma: külföldi magánszemély Indonéziában nem szerezhet teljes értékű freehold (Hak Milik) tulajdont — a bevett szerkezet a 25+25 évre szóló leasehold (Hak Sewa), illetve tartózkodási engedéllyel a Hak Pakai használati jog vagy egy indonéz PT PMA társaságon keresztüli Hak Guna Bangunan. Ezért Balin a jogi struktúra kiválasztása fontosabb, mint maga az ingatlan.",
    introEn:
      "Bali offers some of the world's highest short-let yields — 10–15% gross is common in Canggu, Seminyak and Uluwatu. The key issue is tenure: foreigners cannot hold freehold, so 25+25-year leasehold, Hak Pakai, or a PT PMA company structure is used.",
    highlightsHu: [
      "10–15% bruttó rövid távú bérbeadási hozam a top lokációkban",
      "Külföldi nem szerezhet freehold tulajdont — leasehold (25+25 év) a bevett út",
      "PT PMA társasággal hosszabb távú, építési jogot is adó szerkezet érhető el",
      "Egész éves szezon, dollár-alapú napi díjak"
    ],
    keywords: [
      "Bali villa eladó",
      "Bali ingatlanbefektetés",
      "leasehold villa Bali",
      "Bali property for sale",
      "Canggu villa investment",
      "Bali rental yield"
    ],
    faqHu: [
      {
        q: "Vehet külföldi ingatlant Balin?",
        a: "Teljes értékű freehold (Hak Milik) tulajdont külföldi magánszemély nem szerezhet Indonéziában. Három bevett megoldás van: hosszú távú bérleti jog (leasehold, jellemzően 25 év + hosszabbítás), tartózkodási engedéllyel megszerezhető Hak Pakai használati jog, illetve egy indonéz külföldi tulajdonú társaság (PT PMA) által birtokolt Hak Guna Bangunan építési jog."
      },
      {
        q: "Mekkora hozamot hoz egy bali villa?",
        a: "A jó lokációjú, professzionálisan kezelt villák bruttó hozama jellemzően 10–15% Canggu, Seminyak és Uluwatu környékén. Ebből azonban le kell vonni a villamenedzsment (jellemzően 15–20%), a karbantartás és az adó költségét, így a nettó hozam reálisan 7–10%."
      },
      {
        q: "Mi történik a leasehold lejáratakor?",
        a: "A jól megírt bérleti szerződés tartalmaz hosszabbítási opciót előre rögzített vagy indexált áron. A vásárlás előtti legfontosabb ellenőrzés éppen ez: hány év van hátra, mennyi a hosszabbítási jog, és a földtulajdonos beleegyezése hogyan van biztosítva. Enélkül a befektetés értéke évről évre csökken."
      }
    ]
  },
  HU: {
    name: "Hungary",
    nameHu: "Magyarország",
    inHu: "Magyarországon",
    title: "Property for sale in Hungary — Golden Visa",
    desc: "Verified property in Hungary — Budapest, Lake Balaton, Debrecen. EU member with a €250,000 real-estate route to a 10-year Guest Investor residence permit.",
    introHu:
      "Magyarország 2024-ben indította újra befektetői letelepedési programját: a Vendégbefektetői Program (Guest Investor Program) keretében ingatlanalapon 250 000 eurótól szerezhető tíz évre szóló, megújítható tartózkodási engedély az EU-ban és a schengeni övezetben. Ez az egyik legalacsonyabb küszöbű EU-s befektetői letelepedési út. A hazai piac két motorja Budapest (a belvárosi kerületek bérbeadási hozama és az egyetemi kereslet) és a Balaton, ahol a nyaralópiac az elmúlt években tartósan felértékelődött. Az átírási illeték 4%.",
    introEn:
      "Hungary relaunched its investor residence route in 2024: the Guest Investor Programme grants a renewable 10-year EU/Schengen residence permit from a €250,000 real-estate-based investment — one of the lowest thresholds in the EU.",
    highlightsHu: [
      "250 000 € befektetéstől 10 éves, megújítható EU/schengeni tartózkodási engedély",
      "Vagyonszerzési illeték 4%",
      "Budapest: egész éves, egyetemi és bérlői keresletre épülő hozam",
      "Balaton: tartósan felértékelődő hazai nyaralópiac"
    ],
    keywords: [
      "ingatlan Magyarország",
      "vendégbefektetői program",
      "magyar golden visa",
      "budapesti lakás eladó",
      "balatoni nyaraló eladó",
      "Hungary golden visa real estate",
      "property for sale Budapest"
    ],
    faqHu: [
      {
        q: "Mi a magyar Vendégbefektetői Program?",
        a: "A 2024-ben indult Vendégbefektetői Program (Guest Investor Programme) tíz évre szóló, megújítható magyar tartózkodási engedélyt ad befektetés fejében. Az ingatlanalapú út küszöbe 250 000 euró; az engedély a családtagokra is kiterjeszthető, és schengeni szabad mozgást biztosít. Fontos: ez tartózkodási engedély, nem állampolgárság — ingatlannal közvetlenül állampolgárságot Törökország és Saint Kitts és Nevis ad."
      },
      {
        q: "Mennyi illetéket kell fizetni magyar ingatlanvásárláskor?",
        a: "A visszterhes vagyonátruházási illeték általános mértéke 4% a forgalmi érték után. Első lakást szerző 35 év alatti fiatalok és bizonyos cserével történő vásárlások esetén kedvezmény vagy mentesség érvényesíthető."
      },
      {
        q: "Mekkora bérleti hozam érhető el Budapesten?",
        a: "A budapesti hosszú távú lakáskiadás bruttó hozama jellemzően 4–6%, a belvárosi, egyetemekhez közeli kis lakásoknál ennél magasabb is lehet. A rövid távú kiadás hozama magasabb, de kerületenként eltérő szabályozás vonatkozik rá."
      }
    ]
  },
  TH: {
    name: "Thailand",
    nameHu: "Thaiföld",
    inHu: "Thaiföldön",
    title: "Property for sale in Thailand",
    desc: "Verified condos and villas in Thailand — Bangkok, Phuket, Koh Samui, Chiang Mai. Foreigners can own condominiums freehold, with 2% transfer fee.",
    introHu:
      "Thaiföld a délkelet-ázsiai piacok közül a legkiszámíthatóbb tulajdoni szerkezetet kínálja külföldieknek: társasházi lakást (condominium) külföldi magánszemély SAJÁT NEVÉN, freehold tulajdonként szerezhet — azzal a feltétellel, hogy az adott társasház összterületének legfeljebb 49%-a lehet külföldi kézben. Földet és földdel együtt házat viszont külföldi nem birtokolhat, ott hosszú távú bérleti jog vagy társasági szerkezet szokásos. Bangkok a városi bérbeadás, Phuket és Koh Samui a turisztikai hozam, Chiang Mai a hosszú tartózkodású digitális nomádok piaca.",
    introEn:
      "Thailand offers the clearest ownership route in Southeast Asia: foreigners can own condominiums freehold in their own name, subject to the 49% foreign quota per building. Land cannot be foreign-owned — long leases or company structures are used instead.",
    highlightsHu: [
      "Társasházi lakás freehold, saját néven megszerezhető külföldiként",
      "49%-os külföldi kvóta társasházanként — vásárlás előtt ellenőrizendő",
      "Földet külföldi nem birtokolhat: hosszú távú bérlet a bevett út",
      "Átírási illeték 2%, alacsony tranzakciós költségek"
    ],
    keywords: [
      "ingatlan Thaiföld",
      "Phuket lakás eladó",
      "Bangkok condo befektetés",
      "Thailand property for sale",
      "foreign freehold condo Thailand",
      "Koh Samui villa"
    ],
    faqHu: [
      {
        q: "Vehet külföldi ingatlant Thaiföldön?",
        a: "Társasházi lakást igen, saját néven, freehold tulajdonként — feltéve, hogy az adott épület lakóterületének legfeljebb 49%-a van külföldi tulajdonban. Földet és földdel egybeépült házat külföldi magánszemély nem birtokolhat; ilyen esetben 30 évre szóló, megújítható bérleti jog vagy thai társasági szerkezet jöhet szóba."
      },
      {
        q: "Mit jelent a 49%-os külföldi kvóta?",
        a: "Minden thaiföldi társasházban a lakóterület legfeljebb 49%-a lehet külföldi tulajdonban. Vásárlás előtt a társasház kezelőjétől írásos igazolást kell kérni arról, hogy a kvótában van még szabad hely — enélkül a lakás nem írható át külföldi vevő nevére."
      },
      {
        q: "Mennyi a vásárlás mellékköltsége Thaiföldön?",
        a: "2% átírási illeték (transfer fee), amelyet a felek gyakran megosztanak, továbbá üzleti adó vagy bélyegilleték az eladó oldalán. Az összes tranzakciós költség jellemzően a vételár 3–6%-a, ami nemzetközi összevetésben alacsony."
      }
    ]
  },
  IT: {
    name: "Italy",
    nameHu: "Olaszország",
    inHu: "Olaszországban",
    title: "Property for sale in Italy",
    desc: "Verified property for sale in Italy — Rome, Milan, Florence, Lake Como, Sardinia. EU market with flat-tax regimes for new residents.",
    introHu:
      "Olaszország az EU legmélyebb és legdifferenciáltabb nyaraló- és városi ingatlanpiaca: a Comói-tó és a Toszkána prémium szegmensétől Milánó bérbeadási piacán át a dél-olasz „1 eurós ház” programokig minden árszint elérhető. EU-állampolgár korlátozás nélkül vásárolhat. Az adózás a kulcs: a magánszemélytől vett használt ingatlan átírási adója 9% (második otthon esetén), de a rezidenssé váló vevőnek 2%-ra csökkenhet, és a külföldről beköltözők számára elérhető a 200 000 eurós éves átalányadó (flat tax) a külföldi jövedelemre.",
    introEn:
      "Italy is the EU's deepest holiday-home market, from Lake Como and Tuscany to Milan's rental market. EU citizens buy without restriction; transfer tax is 9% for a second home and 2% for a primary residence, with a flat-tax regime available to new residents.",
    highlightsHu: [
      "EU-tagállam — EU-állampolgárnak nincs vásárlási korlátozás",
      "Átírási adó 9% második otthonnál, 2% ha főlakás lesz",
      "Új rezidenseknek elérhető átalányadó a külföldi jövedelemre",
      "Rendkívül széles árpaletta a prémiumtól a felújítandó vidéki ingatlanig"
    ],
    keywords: [
      "ingatlan Olaszország",
      "olasz nyaraló eladó",
      "Comói-tó ingatlan",
      "Toszkána ház eladó",
      "Italy real estate",
      "property for sale Italy",
      "casa in vendita"
    ],
    faqHu: [
      {
        q: "Mennyi adót fizet a vevő olasz ingatlanvásárláskor?",
        a: "Magánszemélytől vett használt ingatlannál az átírási adó (imposta di registro) 9% a kataszteri érték után, ha második otthonról van szó, és csak 2%, ha a vevő 18 hónapon belül oda jelentkezik be főlakásként. Fejlesztőtől vett új ingatlannál ÁFA (10%, luxusnál 22%) terheli a vételt."
      },
      {
        q: "Vehet magyar állampolgár ingatlant Olaszországban?",
        a: "Igen, korlátozás nélkül — mindkét ország EU-tagállam, így a magyar vevő az olaszokkal azonos feltételekkel vásárolhat. A vásárláshoz olasz adóazonosító (codice fiscale) és olasz bankszámla szükséges."
      },
      {
        q: "Mi az olasz átalányadó (flat tax) új rezidenseknek?",
        a: "Aki Olaszországba helyezi az adóügyi illetőségét, választhatja azt a rendszert, amelyben a külföldről származó jövedelmére évi fix összegű adót fizet (jelenleg 200 000 euró, családtagonként további 25 000 euró), legfeljebb 15 éven át. Ez nagy vagyonú, külföldi jövedelemmel rendelkező befektetőknél lehet meghatározó."
      }
    ]
  },
  GR: {
    name: "Greece",
    nameHu: "Görögország",
    inHu: "Görögországban",
    title: "Property for sale in Greece — Golden Visa",
    desc: "Verified property in Greece — Athens, Crete, the islands. EU Golden Visa residence from €250,000 in eligible areas, with no minimum stay requirement.",
    introHu:
      "Görögország az EU legismertebb Golden Visa programját működteti: ingatlanbefektetéssel öt évre szóló, megújítható tartózkodási engedély szerezhető, amely a teljes családra kiterjed és schengeni szabad mozgást ad, MINIMÁLIS OTTTARTÓZKODÁSI KÖTELEZETTSÉG NÉLKÜL — ez a görög program legerősebb érve. A küszöb 2024 óta területenként sávos: a legkeresettebb övezetekben (Attika, Thesszaloniki, Mükonosz, Szantorini) magasabb, a kevésbé frekventált régiókban maradt a 250 000 eurós belépő, illetve műemléki felújításnál is kedvezőbb. A hozamot Athén városi bérbeadása és a szigetek turisztikai szezonja adja.",
    introEn:
      "Greece runs the EU's best-known Golden Visa: real-estate investment grants a renewable five-year residence permit for the whole family with Schengen mobility and no minimum-stay requirement. Thresholds are now tiered by area.",
    highlightsHu: [
      "Golden Visa 250 000 €-tól a kedvezményes övezetekben (a top zónákban magasabb sáv)",
      "NINCS minimális ottartózkodási kötelezettség",
      "A teljes családra kiterjed (házastárs, gyermekek, eltartott szülők)",
      "5 évre szól, korlátlanul megújítható amíg a befektetés megmarad",
      "Ingatlanátírási adó 3,1%"
    ],
    keywords: [
      "görög golden visa",
      "ingatlan Görögország",
      "golden visa ingatlanbefektetéssel",
      "Greece golden visa property",
      "property for sale Greece",
      "athéni lakás eladó",
      "Kréta ingatlan"
    ],
    faqHu: [
      {
        q: "Hogyan működik a görög Golden Visa?",
        a: "Görög ingatlan megvásárlásával öt évre szóló, megújítható tartózkodási engedély igényelhető, amely kiterjed a házastársra, a 21 év alatti gyermekekre és mindkét fél eltartott szüleire. Az engedély schengeni szabad mozgást ad, és nem ír elő minimális ottartózkodást — elég, ha a befektetést megtartja."
      },
      {
        q: "Mennyi a görög Golden Visa küszöbe?",
        a: "A küszöb 2024 óta területfüggő: a legkeresettebb övezetekben (Attika, Thesszaloniki és a népszerű szigetek, például Mükonosz és Szantorini) magasabb sáv érvényes, míg az ország többi részén, valamint műemléki vagy ipari épület lakóingatlanná alakítása esetén továbbra is a 250 000 eurós belépő él. Vásárlás előtt mindig az adott ingatlan konkrét zónabesorolását kell ellenőrizni."
      },
      {
        q: "A görög Golden Visa állampolgárságot ad?",
        a: "Nem közvetlenül. A Golden Visa tartózkodási engedély; görög állampolgárságot hét év tényleges görögországi tartózkodás után lehet kérelmezni, nyelvi és integrációs feltételekkel. Ha a cél maga az útlevél, ingatlanbefektetéssel közvetlenül Törökország és Saint Kitts és Nevis ad állampolgárságot."
      }
    ]
  },
  ES: {
    name: "Spain",
    nameHu: "Spanyolország",
    inHu: "Spanyolországban",
    title: "Property for sale in Spain",
    desc: "Verified property for sale in Spain — Costa del Sol, Marbella, Barcelona, Valencia, Mallorca. Europe's most liquid holiday-home market.",
    introHu:
      "Spanyolország Európa legnagyobb forgalmú nyaralóingatlan-piaca: a Costa del Sol (Marbella, Málaga), a Costa Blanca (Alicante), a Baleárok és Barcelona kínálata a legmélyebb és legkönnyebben újraértékesíthető a kontinensen. A nemzetközi vevői jelenlét miatt a kilépés (eladás) lényegesen gyorsabb, mint a kisebb piacokon. Fontos jogszabályi változás: a spanyol Golden Visa ingatlanalapú útját 2025 áprilisában megszüntették, tehát ma spanyol ingatlanvásárlással NEM szerezhető befektetői letelepedési engedély — a vásárlás pusztán befektetési és életmód-döntés. Az átírási adó régiónként 6–10%.",
    introEn:
      "Spain is Europe's most liquid holiday-home market — Costa del Sol, Costa Blanca, the Balearics and Barcelona offer the deepest resale demand on the continent. Note: the real-estate route to the Spanish Golden Visa was abolished in April 2025.",
    highlightsHu: [
      "Európa legnagyobb és leglikvidebb nyaralóingatlan-piaca — gyors újraértékesítés",
      "Ingatlanátírási adó (ITP) régiónként 6–10%, új építésűnél 10% ÁFA",
      "FIGYELEM: az ingatlanalapú Golden Visa 2025 áprilisában megszűnt",
      "Kiterjedt magyar és nemzetközi közösség a déli parton"
    ],
    keywords: [
      "ingatlan Spanyolország",
      "Costa del Sol ingatlan",
      "Marbella lakás eladó",
      "spanyol nyaraló eladó",
      "Spain real estate",
      "property for sale Spain",
      "Barcelona apartment"
    ],
    faqHu: [
      {
        q: "Létezik még a spanyol Golden Visa ingatlanvásárlással?",
        a: "Nem. Spanyolország 2025 áprilisában megszüntette a Golden Visa ingatlanbefektetésen alapuló útját, így 500 000 eurós ingatlanvásárlással ma már nem szerezhető spanyol befektetői tartózkodási engedély. EU-n belül Görögország és Magyarország kínál ingatlanalapú letelepedési programot; állampolgárságot ingatlannal Törökország és Saint Kitts és Nevis ad."
      },
      {
        q: "Mennyi adót fizet a vevő Spanyolországban?",
        a: "Használt ingatlannál a régiótól függően 6–10% átírási adó (ITP) terheli a vevőt — Andalúziában jelenleg 7%, Katalóniában sávosan 10%-ig. Új építésű, fejlesztőtől vett ingatlannál 10% ÁFA plusz kb. 1,5% okirati illeték (AJD) fizetendő."
      },
      {
        q: "Mire van szükség magyar vevőként spanyol ingatlanvásárláshoz?",
        a: "Spanyol adóazonosítóra (NIE), spanyol bankszámlára és jellemzően független ügyvédre. EU-állampolgárként semmilyen vásárlási korlátozás nem vonatkozik Önre, és a folyamat közjegyző előtt zárul (escritura pública)."
      }
    ]
  },
  KN: {
    name: "Saint Kitts and Nevis",
    nameHu: "Saint Kitts és Nevis",
    inHu: "Saint Kitts és Nevisen",
    title: "Property for sale in Saint Kitts and Nevis — citizenship by investment",
    desc: "Approved real estate in Saint Kitts and Nevis from USD 325,000 grants full CITIZENSHIP and a passport with visa-free access to 150+ countries, in 4–8 months.",
    introHu:
      "Saint Kitts és Nevis a világ legrégebbi, 1984 óta megszakítás nélkül működő állampolgárság-befektetési programját (CBI) üzemelteti — ez a „platina szabvány” a szakmában. A kormány által JÓVÁHAGYOTT ingatlanprojektben vásárolt, kb. 325 000 USD értékű ingatlan közvetlenül ÁLLAMPOLGÁRSÁGOT ad: nem tartózkodási engedélyt, hanem útlevelet, a teljes családra kiterjeszthetően, letelepedési, nyelvi és látogatási kötelezettség NÉLKÜL. A karibi szigetország nem vet ki személyi jövedelemadót, vagyonadót és örökösödési adót, az útlevél pedig 150 feletti ország vízummentes látogatását teszi lehetővé, köztük a schengeni övezet és az Egyesült Királyság. Az ingatlan jellemzően 5–7 év után továbbadható, és az új vevő is felhasználhatja állampolgárság igényléséhez.",
    introEn:
      "Saint Kitts and Nevis runs the world's oldest citizenship-by-investment programme, unbroken since 1984. Approved real estate from about USD 325,000 grants full CITIZENSHIP — a passport, not a residence permit — for the whole family, with no residence, language or visit requirement, in typically 4–8 months.",
    highlightsHu: [
      "~325 000 USD jóváhagyott ingatlan → teljes ÁLLAMPOLGÁRSÁG és útlevél",
      "A világ legrégebbi (1984) és legstabilabb CBI programja",
      "Nincs letelepedési, nyelvi vagy akár beutazási kötelezettség",
      "Nincs jövedelem-, vagyon- és örökösödési adó",
      "Vízummentes belépés 150+ országba (Schengen, Egyesült Királyság)",
      "Az eljárás átvilágítással jellemzően 4–8 hónap",
      "Az ingatlan jellemzően 5–7 év után továbbértékesíthető"
    ],
    keywords: [
      "állampolgárság ingatlanbefektetéssel",
      "citizenship by investment ingatlan",
      "Saint Kitts állampolgárság",
      "karibi útlevél befektetéssel",
      "Saint Kitts and Nevis citizenship by investment",
      "second passport real estate",
      "CBI real estate Caribbean"
    ],
    faqHu: [
      {
        q: "Hogyan lehet Saint Kitts és Nevisen ingatlannal állampolgárságot szerezni?",
        a: "A kormány által jóváhagyott (approved) ingatlanprojektben kell legalább kb. 325 000 USD értékű részesedést vagy ingatlant vásárolni, majd a hivatalos ügynökön keresztül benyújtani az állampolgársági kérelmet. Az eljárás szigorú átvilágítással (due diligence) jár, jellemzően 4–8 hónapig tart, és a sikeres kérelmező, valamint a családja állampolgárságot és útlevelet kap."
      },
      {
        q: "Kell Saint Kitts és Nevisen élni az állampolgárság megtartásához?",
        a: "Nem. A programnak nincs letelepedési, ottartózkodási, nyelvi vagy vizsgakövetelménye — a kérelmezőnek még beutaznia sem kell az országba. Az állampolgárság határozatlan időre szól, és öröklődik a következő generációra."
      },
      {
        q: "Mennyit ér a Saint Kitts és Nevis-i útlevél?",
        a: "Az útlevél több mint 150 ország vízummentes vagy vízum-a-határon látogatását teszi lehetővé, köztük a teljes schengeni övezetet, az Egyesült Királyságot, Szingapúrt és Hongkongot. Az ország nem vet ki személyi jövedelemadót, vagyonadót vagy örökösödési adót."
      },
      {
        q: "Eladhatom később a megvásárolt ingatlant?",
        a: "Igen. A jóváhagyott ingatlan jellemzően 5–7 év tartás után továbbértékesíthető, és az új külföldi vevő maga is felhasználhatja ugyanazt az ingatlant állampolgársági kérelméhez — ez adja a program másodlagos piacát. Az állampolgárság az eladás után is megmarad."
      },
      {
        q: "Miben más Saint Kitts és Nevis, mint a török program?",
        a: "Mindkettő ingatlanbefektetéssel ad ÁLLAMPOLGÁRSÁGOT, de más profillal. Törökország magasabb küszöbű (400 000 USD), viszont nagy, likvid ingatlanpiacot és gyorsabb, 3–6 hónapos eljárást kínál, valamint utat az USA E-2 vízumához. Saint Kitts és Nevis alacsonyabb belépővel, adómentes környezettel és erősebb útlevéllel (150+ ország) dolgozik, cserébe a piac kicsi és a kilépés lassabb."
      }
    ]
  }
};

/* ------------------------------------------------------------------ *
 * JSON-LD építők
 *
 * A strukturált adat az, amitől a Google gazdag találatot (rich result) tud
 * mutatni, és amitől az LLM-ek egyértelműen ki tudják nyerni a tényeket. Minden
 * builder sima objektumot ad vissza — a <JsonLd> komponens szerializálja.
 * ------------------------------------------------------------------ */

export const ORG_ID = `${SITE_URL}/#organization`;
export const SITE_ID = `${SITE_URL}/#website`;

/** Szervezet — a márkanév-keresés és a Knowledge Panel alapja. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": ORG_ID,
    name: "Proopify",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    description:
      "Verifikált külföldi ingatlanhirdetések 12 országban, Golden Visa és ingatlanbefektetéssel szerezhető állampolgársági programokkal.",
    areaServed: COUNTRIES.map((c) => ({ "@type": "Country", name: COUNTRY_SEO[c.code].name })),
    knowsLanguage: ["hu", "en", "de", "ru", "sr", "hr", "tr", "el", "es", "it", "sq", "uk", "th"]
  };
}

/** Weboldal + belső kereső — ettől jelenhet meg sitelinks searchbox. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    url: SITE_URL,
    name: "Proopify",
    publisher: { "@id": ORG_ID },
    inLanguage: "hu",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string"
    }
  };
}

/** Morzsamenü — a Google a találatban a URL helyett ezt mutatja. */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url
    }))
  };
}

/** GYIK — ez a leggyakrabban idézett blokk mind a Google, mind az LLM-ek felé. */
export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };
}

/** Ország-landing: gyűjtőoldal a piac tényadataival. */
export function countryCollectionJsonLd(code: CountryCode, listingCount: number) {
  const seo = COUNTRY_SEO[code];
  const gv = COUNTRY_BY_CODE[code].goldenVisa;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/l/${code}#collection`,
    url: `${SITE_URL}/l/${code}`,
    name: seo.title,
    description: seo.desc,
    isPartOf: { "@id": SITE_ID },
    about: {
      "@type": "Country",
      name: seo.name,
      ...(gv
        ? {
            additionalProperty: {
              "@type": "PropertyValue",
              name:
                gv.kind === "citizenship"
                  ? "Citizenship by real estate investment (minimum, EUR)"
                  : "Golden Visa residence by real estate investment (minimum, EUR)",
              value: gv.minEur
            }
          }
        : {})
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: listingCount,
      itemListElement: COUNTRY_BY_CODE[code].cities.slice(0, 10).map((city, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: city,
        url: `${SITE_URL}/search?country=${code}&city=${encodeURIComponent(city)}`
      }))
    }
  };
}
