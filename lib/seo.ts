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

/** Az adókulcs százalékos szövege az egyetlen igazságforrásból (geo.ts).
 *  Sávos adónál (Montenegró) a teljes sávot mutatjuk, mert egyetlen kulcs
 *  megtévesztő lenne — egy 600 000 €-s ingatlannál nem 3%-ot fizet a vevő. */
export const transferTaxPct = (c: CountryCode): string => {
  const costs = COUNTRY_BY_CODE[c].costs;
  const bands = costs.transferTaxBands;
  if (bands && bands.length > 1) {
    const lo = Math.round(bands[0].rate * 1000) / 10;
    const hi = Math.round(bands[bands.length - 1].rate * 1000) / 10;
    // Csak a sávot adjuk vissza, nyelvfüggetlenül — a „sávos" szó a felületen
    // fordított feliratként jelenik meg, nem itt beégetve.
    return `${lo}–${hi}%`;
  }
  const r = costs.transferTaxRate;
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
      "Montenegró az Adria egyik legkedvezőbb árfekvésű tengerparti piaca: euróval fizet, és a külföldi vevő gyakorlatilag ugyanolyan jogokkal vásárolhat lakást vagy házat, mint a helyiek. Az ingatlanátírási adó 2024 óta sávos: 150 000 €-ig 3%, efölött 5%, 500 000 € felett 6%. A kereslet gerincét Budva, Kotor, Tivat (Porto Montenegro) és Herceg Novi adja; a Boka Kotorska öböl tengerre néző lakásai a legkeresettebb befektetési termékek, míg Bar és Ulcinj még mindig lényegesen olcsóbb belépőt kínál. Az ország EU-tagjelölt, ami hosszú távon árfelhajtó tényező.",
    introEn:
      "Montenegro is one of the most affordable coastal markets on the Adriatic: it uses the euro, property transfer tax is just 3%, and foreign buyers can purchase apartments and houses on essentially the same terms as locals. Demand centres on Budva, Kotor, Tivat (Porto Montenegro) and Herceg Novi.",
    highlightsHu: [
      "Hivatalos fizetőeszköz az euró — nincs árfolyamkockázat a vételárban",
      "Sávos átírási adó 2024 óta: 3% / 5% / 6% (150 000 és 500 000 eurós határokkal)",
      "Új építésűnél nincs átírási adó — helyette 21% ÁFA van az árban",
      "Külföldi magánszemély szabadon vehet lakást, házat és építési telket",
      "EU-állampolgárnak NINCS értékhatár a tartózkodási engedélyhez (harmadik országbelinek 2026 óta 150 000 €)",
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
        a: "Az átírási adó 2024 óta sávos: 150 000 €-ig 3%; 150 000 és 500 000 € között 4 500 € plusz a 150 000 € feletti rész 5%-a; 500 000 € felett 22 000 € plusz az 500 000 € feletti rész 6%-a. Az alapja az adóhatóság által megállapított forgalmi érték, nem feltétlenül a szerződéses ár. Ehhez jön a közjegyzői díj, kb. 1% ügyvédi díj, és a közvetítői jutalék (jellemzően 3%, szokás szerint az eladó fizeti). Új építésű, 2003 után épült ingatlan első értékesítésénél nincs átírási adó — ott 21% ÁFA van az árban."
      },
      {
        q: "Ad Montenegró tartózkodási engedélyt ingatlanvásárlásért?",
        a: "Igen, ingatlantulajdon alapján egy évre szóló, évente megújítandó tartózkodási engedély kérhető. 2026. január 17-től harmadik országbeli állampolgárnak ehhez legalább 150 000 € adóhatósági értékű ingatlan kell — EU-, EGT- és svájci állampolgárokra viszont EZ AZ ÉRTÉKHATÁR NEM VONATKOZIK, tehát magyar vevőnek nincs minimum. A korábbi állampolgárság-befektetési program 2022. december 31-én lezárult, tehát ma Montenegróban ingatlannal állampolgárságot nem lehet szerezni — erre ingatlannal elsősorban Törökország kínál utat."
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
      "Ingatlanátírási adó 3% fix; új építésűnél helyette 25% ÁFA van az árban",
      "Alacsony közjegyzői költség: a közjegyző csak aláírás-hitelesítést végez (néhány euró), nem szerkeszt szerződést",
      "2025 óta ÉVES ingatlanadó is van: 0,60–8,00 €/m²/év, önkormányzatonként",
      "A mezőgazdasági földre vonatkozó moratórium 2023. június 30-án lejárt — EU-s vevő ma már szabadon vásárolhat",
      "Erős, de erősen szezonális rövid távú bérbeadási piac"
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
        a: "Igen, korlátozás nélkül. Mivel Magyarország és Horvátország is EU-tagállam, a magyar magánszemély a horvát állampolgárokkal azonos feltételekkel, saját néven vásárolhat lakást vagy házat — igazságügy-minisztériumi engedélyre nincs szükség. A mezőgazdasági földre vonatkozó átmeneti moratórium 2023. június 30-án lejárt, és nem hosszabbították meg, tehát EU-állampolgárként ma már termőföldet is a horvátokkal azonos feltételekkel vásárolhat. Harmadik országbeli vevőnek továbbra is viszonosság és minisztériumi engedély kell."
      },
      {
        q: "Mennyi adót kell fizetni horvát ingatlanvásárláskor?",
        a: "Használt ingatlan vételekor 3% ingatlanátírási adót (porez na promet nekretnina) fizet a vevő — ez fix kulcs, nem sávos. Új építésű, ÁFA-alany fejlesztőtől vásárolt ingatlannál nincs átírási adó, mert az árban 25% ÁFA szerepel; a kettő kizárja egymást. Fontos: a horvát közjegyző NEM szerkeszt adásvételi szerződést, csak az eladó aláírását hitelesíti, ezért a közjegyzői költség néhány euró plusz a földhivatali bejegyzés — a máshol szokásos „1% közjegyzői díj” itt téves. Ügyvédi díj jellemzően 1–1,5% + ÁFA, közvetítői jutalék 2–4%. 2025 óta éves ingatlanadó is terheli a tulajdont (0,60–8,00 €/m²/év), amely alól a bejelentett lakóhely és a legalább 10 hónapos hosszú távú bérbeadás mentesül."
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
      "A VEVŐ nem fizet értékarányos átírási adót — csak fix közjegyzői illetéket és bejegyzési díjat",
      "Új építésűnél sincs ÁFA a vevő oldalán: az ingatlan-értékesítés ÁFA-mentes",
      "Külföldi magánszemély saját néven vehet lakást és házat, engedély nélkül",
      "Építési TELEK vásárlásához feltétel, hogy a beruházás értéke a telekérték háromszorosát meghaladja",
      "Mezőgazdasági földet külföldi nem vásárolhat, csak bérelhet"
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
        a: "Ksamilban és Sarandëban az új építésű, tengerre néző lakások jellemzően 1 200–2 200 €/m² sávban mozognak, Vlorában és Durrësban ennél is olcsóbban lehet belépni. Ez nagyságrendileg fele-harmada a hasonló horvát vagy görög kínálatnak. A vevő mellékköltsége is a legalacsonyabb a régióban: értékarányos átírási adó és ÁFA nélkül jellemzően a vételár 1–4%-a."
      },
      {
        q: "Ad Albánia tartózkodási engedélyt ingatlanvásárlásért?",
        a: "Albániának nincs Golden Visa programja és állampolgárság-befektetési programja sem: a 2020-as törvényben szereplő lehetőséget soha nem indították el, 2023 márciusa óta moratórium van rajta, az Európai Bíróság 2025. áprilisi máltai ítélete után pedig az EU-csatlakozásra készülő Albánia aligha nyitja meg. Ingatlantulajdon alapján viszont kérhető egy évre szóló, megújítható tartózkodási engedély, öt év után állandó tartózkodással. A közvetítők által emlegetett „100 000 eurós küszöb” nem igazolható jogszabályból — ne tervezzen rá."
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
      "Ingatlanátírási adó 2,5% használt ingatlanra (törvény szerint az ELADÓ fizeti, de a szerződések jellemzően a vevőre terhelik)",
      "Új építésűnél helyette 10% ÁFA (lakóingatlan) van az árban",
      "Külföldi vevő VISZONOSSÁG alapján vásárolhat — magyar állampolgárra ez teljesül, de országonként külön vizsgálandó",
      "Az elsőlakás-kedvezmények csak szerb állampolgárnak járnak — külföldi vevő nem veheti igénybe",
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
        a: "Igen. Szerbia viszonosság alapján engedi a külföldi magánszemélyek ingatlanszerzését, és Magyarországgal ez a viszonosság fennáll (a minisztérium listáján szerepel), így magyar állampolgár saját néven vásárolhat lakást vagy házat. Fontos: a viszonosságot ORSZÁGONKÉNT vizsgálják, nem EU-szinten — nem igaz tehát, hogy „bármely EU-állampolgár szabadon vásárolhat”. Mezőgazdasági földre EU-s magánszemély elvileg jogosult, de olyan együttes feltételekkel (10 év helyben lakás, 3 év művelés, 2 hektáros korlát), amelyek a gyakorlatban szinte teljesíthetetlenek."
      },
      {
        q: "Mekkora bérleti hozamot lehet elérni Belgrádban?",
        a: "A belgrádi hosszú távú lakáskiadás bruttó hozama jellemzően 4–6% között alakul, ami magasabb, mint a legtöbb EU-s fővárosban, és a kereslet egész éves — nem függ a turisztikai szezontól."
      },
      {
        q: "Mennyi az ingatlanvásárlás költsége Szerbiában?",
        a: "Használt ingatlannál 2,5% átírási adó (porez na prenos apsolutnih prava). Ezt a törvény az ELADÓRA rója, a szerződések viszont szinte mindig a vevőre hárítják — az eladó ilyenkor is felelős marad, ezért érdemes a befizetést ellenőrizni. Új építésű, 2005 után elkészült ingatlan első értékesítésénél átírási adó helyett ÁFA van az árban: lakóingatlannál 10%, garázsnál és üzlethelyiségnél 20%. A közjegyzői díj sávos tarifa szerint alakul (egy átlagos lakásnál néhány száz euró — az „1–2% közjegyzői díj” téves), ehhez jön az ügyvédi díj és 2–4% közvetítői jutalék. Az elsőlakás-vásárlói adómentességre és ÁFA-visszatérítésre csak szerb állampolgár jogosult."
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
      "Törökország a világ legnagyobb volumenű, ingatlanalapú állampolgársági programját működteti: 400 000 USD értékű ingatlan megvásárlása és három évig tartó megtartása mellett a befektető és a családja török ÁLLAMPOLGÁRSÁGOT — nem csak tartózkodási engedélyt — kaphat, jellemzően 3–6 hónap alatt, tartózkodási kötelezettség nélkül. A török útlevél vízummentes belépést ad kb. 118 országba, és utat nyit az USA E-2 befektetői vízumához. A piac két lába: Isztambul (városi bérbeadás és értéknövekedés) és a mediterrán part (Antalya, Alanya, Bodrum, Fethiye) nyaraló- és bérbeadási céllal. Az átírási adó 4%, a vételár devizás rögzítése kötelező a programban.",
    introEn:
      "Turkey runs the world's highest-volume real-estate citizenship programme: buying USD 400,000 of property and holding it for three years grants the investor and family full Turkish CITIZENSHIP — not just residence — typically in 3–6 months, with no residence requirement.",
    highlightsHu: [
      "400 000 USD ingatlanvásárlás → török ÁLLAMPOLGÁRSÁG 3–6 hónap alatt",
      "Nincs tartózkodási, nyelvi vagy letelepedési kötelezettség",
      "A teljes család (házastárs + 18 alatti gyermekek) bevonható",
      "Az ingatlant 3 évig meg kell tartani, utána szabadon értékesíthető",
      "Vízummentes belépés kb. 118 országba; út az USA E-2 befektetői vízumához"
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
        a: "Legalább 400 000 USD értékű török ingatlant kell megvásárolni, és vállalni kell, hogy három évig nem adja el — ezt „satılamaz” (nem eladható) bejegyzésként a tulajdoni lapra (tapu) is rávezetik. Fontos: nem a szerződéses ár számít, hanem az SPK-engedéllyel rendelkező értékbecslő hivatalos értékbecslése; a küszöböt a kifizetett (bankon át igazolt) árnak, az értékbecslésnek és a tapun szereplő értéknek egyaránt el kell érnie. Ezután benyújtható a tartózkodási engedély és az állampolgársági kérelem; a teljes eljárás jellemzően 3–6 hónap, és kiterjed a házastársra és a 18 év alatti gyermekekre."
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
      "Bali erős rövid távú bérbeadási piac, de a valós számok jóval szerényebbek a hirdetett hozamoknál: független foglalási adatok szerint Cangguban az átlagos napi díj kb. 216 USD, a kihasználtság viszont mindössze 38% körüli, és a kínálat évi 40%-kal bővül. Reálisan 6–9% bruttó és 3–5% nettó hozammal érdemes számolni, nem a szórólapokon szereplő 10–15%-kal. A másik kulcskérdés a tulajdonforma: külföldi magánszemély Indonéziában NEM szerezhet freehold (Hak Milik) tulajdont. Három legális út van: szerződéses bérleti jog (Hak Sewa, jellemzően 25–30 év), tartózkodási engedélyhez kötött Hak Pakai használati jog (30 + 20 + 30 = akár 80 év), vagy egy indonéz PT PMA társaságon keresztüli Hak Guna Bangunan építési jog (ugyancsak 80 év). Balin a jogi struktúra kiválasztása fontosabb, mint maga az ingatlan.",
    introEn:
      "Bali offers some of the world's highest short-let yields — 10–15% gross is common in Canggu, Seminyak and Uluwatu. The key issue is tenure: foreigners cannot hold freehold, so 25+25-year leasehold, Hak Pakai, or a PT PMA company structure is used.",
    highlightsHu: [
      "Reális hozam független adatok alapján: 6–9% bruttó, 3–5% nettó (a 10–15% marketingszám)",
      "Külföldi NEM szerezhet freehold (Hak Milik) tulajdont — ez alkotmányos korlát",
      "Hak Sewa bérleti jog: tartózkodási engedély nélkül is, jellemzően 25–30 év",
      "Hak Pakai és PT PMA-s Hak Guna Bangunan: 30 + 20 + 30, összesen akár 80 év",
      "VESZÉLY: a „nominee” (indonéz strómanra íratott freehold) szerkezet TÖRVÉNY SZERINT SEMMIS",
      "Ha a Hak Pakai tulajdonos tartózkodási engedélye lejár, egy éven belül el kell adnia az ingatlant",
      "Vevői mellékköltség: bérleti jognál 2–4%, Hak Pakainál 7–9% (5% BPHTB miatt)"
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
        q: "Ad Indonézia tartózkodási engedélyt ingatlanvásárlásért?",
        a: "Korlátozottan. Az indonéz Golden Visa ingatlanalapú ága 1 000 000 USD befektetést kíván, és KIZÁRÓLAG megfelelő jogcímű társasházi lakásra vonatkozik — az egyedi telken álló villák nem jogosítanak. Létezik emellett egy „second home” vízum is, de a hivatalos oldal nem közöl konkrét értékhatárt, ezért a közvetítők által emlegetett összegeket érdemes fenntartással kezelni. Állampolgárság-befektetési program Indonéziában nincs."
      },
      {
        q: "Vehet külföldi ingatlant Balin?",
        a: "Teljes értékű freehold (Hak Milik) tulajdont külföldi magánszemély nem szerezhet Indonéziában — ezt az 1960-as alaptörvény indonéz állampolgároknak tartja fenn. Három legális megoldás van: szerződéses bérleti jog (Hak Sewa, jellemzően 25–30 év, tartózkodási engedély nem kell hozzá), Hak Pakai használati jog (érvényes KITAS/KITAP tartózkodási engedélyhez kötve, 30 + 20 + 30 = akár 80 év), illetve egy külföldi tulajdonú indonéz társaság (PT PMA) által birtokolt Hak Guna Bangunan építési jog (szintén 80 év). NAGYON FONTOS: a Balin gyakran árult „nominee” szerkezet, amelyben egy indonéz állampolgár nevén van a freehold „az Ön javára”, a törvény szerint SEMMIS — a bíróság előtt nem érvényesíthető, és az ingatlan a strómannál vagy az államnál marad."
      },
      {
        q: "Mekkora hozamot hoz egy bali villa?",
        a: "Kevesebbet, mint amit hirdetnek. Független foglalási adatok szerint Cangguban — ahol közel 4 000 aktív hirdetés verseng — az átlagos napi díj kb. 216 USD és az éves kihasználtság 38% körüli, ami átlagosan évi kb. 23 700 USD bevételt jelent. Ebből le kell vonni a villamenedzsmentet (15–20%), a karbantartást és az adót. Reálisan 6–9% bruttó és 3–5% nettó hozammal érdemes tervezni. A 10–15%-os nettó ígéretek az értékesítői anyagokból származnak, és a piaci adatok nem támasztják alá — a kínálat évi 40% feletti ütemben nő, miközben a kereslet lapos, ezért a tulajdonosok 10–30%-ot engednek az árakból."
      },
      {
        q: "Mi történik a leasehold lejáratakor?",
        a: "A jól megírt bérleti szerződés tartalmaz hosszabbítási opciót előre rögzített vagy indexált áron. A vásárlás előtti legfontosabb ellenőrzés éppen ez: hány év van hátra, mennyi a hosszabbítási jog, és a földtulajdonos beleegyezése hogyan van biztosítva. Enélkül a befektetés értéke évről évre csökken. Hak Pakai esetén van egy további csapda: ha a tulajdonos tartózkodási engedélye lejár és nem újítja meg, egy éven belül köteles értékesíteni az ingatlant, különben állami árverésre kerülhet."
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
      "Magyarország 2024-ben indította újra befektetői letelepedési programját, de itt egy fontos félreértést kell tisztázni: a Vendégbefektetői Programban KÖZVETLEN LAKÁSVÁSÁRLÁS NEM JOGOSÍT tartózkodási engedélyre. A tervezett 500 000 eurós közvetlen ingatlan-opciót 2025 januárjában törölték, mielőtt hatályba lépett volna. Két út maradt: 250 000 € értékű befektetési jegy egy MNB-nél nyilvántartott ingatlanalapban (amelynek nettó eszközértéke legalább 40%-ban magyar lakóingatlanban van), öt éves tartási kötelezettséggel, vagy 1 000 000 € vissza nem térítendő adomány magyar felsőoktatási intézménynek. A magyar ingatlanpiac két motorja Budapest és a Balaton; a visszterhes vagyonátruházási illeték 4% egymilliárd forintig.",
    introEn:
      "Hungary relaunched its investor residence route in 2024: the Guest Investor Programme grants a renewable 10-year EU/Schengen residence permit from a €250,000 real-estate-based investment — one of the lowest thresholds in the EU.",
    highlightsHu: [
      "FIGYELEM: közvetlen lakásvásárlás NEM jogosít vendégbefektetői tartózkodási engedélyre",
      "A programban csak ingatlanalap-befektetési jegy (250 000 €, 5 év tartás) vagy felsőoktatási adomány (1 000 000 €) számít",
      "Az engedély 10 évre szól, egyszer további 10 évvel meghosszabbítható",
      "Visszterhes vagyonátruházási illeték 4% egymilliárd forintig, felette 2% (ingatlanonként legfeljebb 200 millió Ft)",
      "Új lakásnál 5% ÁFA (150 m²-ig lakás, 300 m²-ig ház) 2026 végéig",
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
        q: "Kaphatok magyar tartózkodási engedélyt, ha lakást veszek Magyarországon?",
        a: "Nem. Ez a leggyakoribb félreértés a magyar programmal kapcsolatban. A Vendégbefektetői Programban a közvetlen lakás- vagy házvásárlás NEM minősül befektetésnek: a tervezett 500 000 eurós közvetlen ingatlan-opciót 2025 januárjában törölték, mielőtt hatályba lépett volna. Két lehetőség van: 250 000 € értékű befektetési jegy vásárlása MNB-nél nyilvántartott, legalább 40%-ban magyar lakóingatlanba fektető ingatlanalapban (5 év tartási kötelezettséggel), vagy 1 000 000 € adomány magyar felsőoktatási intézménynek. Az engedély 10 évre szól és egyszer további 10 évvel hosszabbítható. Magyar és EU-állampolgárnak természetesen nincs szüksége erre — szabad mozgás illeti meg."
      },
      {
        q: "Mennyi illetéket kell fizetni magyar ingatlanvásárláskor?",
        a: "A visszterhes vagyonátruházási illeték 4% a forgalmi érték egymilliárd forintot meg nem haladó részére, és 2% az efölötti részre, ingatlanonként legfeljebb 200 millió forint. Fejlesztőtől vett új lakásnál az illeték 15 millió forint értékig mentes, efölött a különbözetre 4%. Kedvezmény vagy mentesség érvényesíthető első lakást szerző fiataloknál, CSOK-os vásárlásnál, valamint ha az eladás és a vétel öt éven belül történik — ilyenkor csak az árkülönbözet után kell fizetni. Új lakás ÁFÁ-ja 27% helyett 5%, 150 m²-ig lakásnál és 300 m²-ig háznál, 2026 végéig."
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
      "49%-os külföldi kvóta társasházanként, az ALAPTERÜLET arányában — vásárlás előtt írásban ellenőrizendő",
      "A vételárat külföldről, devizában kell utalni (FET-igazolás nélkül nincs átírás)",
      "Földet külföldi nem birtokolhat; a bejegyezhető bérlet törvényi maximuma 30 év",
      "A „30+30+30” hosszabbítás csak szerződéses ígéret — a bíróság az új tulajdonossal szemben nem érvényesítette",
      "Átírási illeték 2%, szokás szerint a felek felezik — a vevő teljes költsége jellemzően 1–2%",
      "FIGYELEM: a 0,01%-os illetékkedvezmény CSAK thai állampolgárokra vonatkozik, külföldi vevőre nem"
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
        a: "Társasházi lakást igen, saját néven, freehold tulajdonként — feltéve, hogy az adott épület nyilvántartott, értékesíthető alapterületének legfeljebb 49%-a van külföldi tulajdonban. A vételárat külföldről, devizában kell utalni, és a földhivatal az erről szóló FET-igazolás nélkül nem jegyzi be a tulajdonjogot. Földet és földdel egybeépült házat külföldi magánszemély nem birtokolhat; ilyenkor legfeljebb 30 évre bejegyezhető bérleti jog, haszonélvezet vagy thai többségű társaság jöhet szóba. Vigyázat: a thai többségű társaság csak valódi thai tulajdonosokkal jogszerű — a stróman-szerkezet a külföldi üzleti törvénybe ütközik, és a hatóságok aktívan vizsgálják."
      },
      {
        q: "Igaz, hogy Thaiföldön 75%-ra emelik a külföldi kvótát és 99 évre a bérletet?",
        a: "Nem, ez jelenleg NEM hatályos jog. A kormány 2024-ben csak azt hagyta jóvá, hogy a két javaslatot megvizsgálják; törvény soha nem született belőlük. A 99 éves bérletre vonatkozó tervet 2025 szeptemberében hivatalosan levették a napirendről. 2026 közepén a hatályos szabály változatlanul 49%-os külföldi kvóta és 30 éves maximális bejegyezhető bérlet. Aki 99 éves időtávra árazott ingatlant vásárol, olyan jogot fizet meg, ami nem létezik."
      },
      {
        q: "Mit jelent a 49%-os külföldi kvóta?",
        a: "Minden thaiföldi társasházban a nyilvántartott, értékesíthető alapterület legfeljebb 49%-a lehet külföldi tulajdonban — a korlát tehát alapterület-arányos, nem a lakások darabszáma szerinti. Vásárlás előtt a társasház kezelőjétől írásos igazolást kell kérni arról, hogy a kvótában van még szabad hely; enélkül a lakás nem írható át külföldi vevő nevére, és a foglaló könnyen bennragad."
      },
      {
        q: "Mennyi a vásárlás mellékköltsége Thaiföldön?",
        a: "2% átírási illeték (transfer fee) a hivatalos becsült érték után, amelyet a felek szokás szerint feleznek. Az eladót terheli az üzleti adó (3,3%, ha öt évnél rövidebb ideig birtokolta) vagy helyette a bélyegilleték (0,5%, ha legalább öt évig), továbbá a forrásadó. A két fél együttes költsége jellemzően a vételár 6–8%-a, de a szokásos megosztás mellett a KÜLFÖLDI VEVŐ oldalán ez csak kb. 1–2% az ügyvédi és átvilágítási díjjal együtt. Fontos: a sokat emlegetett 0,01%-os kedvezményes átírási illeték kizárólag thai állampolgárokra vonatkozik — külföldi vevő és thai cég a teljes 2%-ot fizeti."
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
      "Átírási adó 9% második otthonnál, 2% ha „prima casa” (főlakás) lesz; minimum 1 000 €",
      "Magánszemélytől vásárolva az adó alapja a kataszteri érték (prezzo-valore), ami jellemzően jóval a vételár alatt van",
      "Fejlesztőtől vett új ingatlannál ÁFA: 4% főlakás, 10% második otthon, 22% luxuskategória",
      "NINCS ingatlanalapú Golden Visa — az olasz befektetői vízumból az ingatlan kifejezetten ki van zárva",
      "Új rezidenseknek átalányadó a külföldi jövedelemre: 2026. január 1-től évi 300 000 €"
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
        a: "Magánszemélytől vett használt ingatlannál az átírási adó (imposta di registro) 9%, ha második otthonról van szó, és csak 2%, ha a vevő 18 hónapon belül oda jelentkezik be főlakásként; a minimum mindkét esetben 1 000 €. Magánszemélyek közötti adásvételnél az adó alapja kérhetően a kataszteri érték (prezzo-valore), ami jellemzően jóval a tényleges vételár alatt van — ez érdemi megtakarítás. Ehhez jön két fix, egyenként 50 eurós illeték. Fejlesztőtől, az elkészülés utáni 5 éven belül vett új ingatlannál ÁFA terheli a vételt: 4% főlakásnál, 10% második otthonnál, 22% az A/1, A/8 és A/9 luxus-kataszteri kategóriákban, plusz három darab 200 eurós fix illeték."
      },
      {
        q: "Vehet magyar állampolgár ingatlant Olaszországban?",
        a: "Igen, korlátozás nélkül — mindkét ország EU-tagállam, így a magyar vevő az olaszokkal azonos feltételekkel vásárolhat. A vásárláshoz olasz adóazonosító (codice fiscale) és olasz bankszámla szükséges."
      },
      {
        q: "Mi az olasz átalányadó (flat tax) új rezidenseknek?",
        a: "Aki Olaszországba helyezi az adóügyi illetőségét, választhatja azt a rendszert, amelyben a külföldről származó jövedelmére évi fix összegű adót fizet, legfeljebb 15 éven át. Az összeg a 2026-os költségvetési törvénnyel évi 300 000 euróra emelkedett azoknál, akik 2026. január 1-től telepítik át az illetőségüket (családtagonként további 50 000 euró). A korábban belépőkre a régi tétel marad érvényben: 100 000 € a 2024 előtti, 200 000 € a 2024–2025-ös belépőknél. Fontos: ez adójogi konstrukció, NEM tartózkodási program — olasz ingatlanvásárlás önmagában nem ad letelepedési jogot."
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
      "Görögország az EU legismertebb Golden Visa programját működteti: ingatlanbefektetéssel öt évre szóló, megújítható tartózkodási engedély szerezhető, amely a teljes családra kiterjed és schengeni szabad mozgást ad, MINIMÁLIS OTTTARTÓZKODÁSI KÖTELEZETTSÉG NÉLKÜL — ez a program legerősebb érve. A küszöb az 5100/2024 törvény óta területenként sávos: 800 000 € Attika egész régiójában, Thesszalonikiben, Mükonoszon, Szantorinin és a 3 100 főnél népesebb szigeteken; 400 000 € az ország többi részén; 250 000 € pedig KIZÁRÓLAG nem lakáscélú épület lakássá alakításánál vagy műemlék felújításánál. Két gyakran elhallgatott feltétel: az ingatlannak egyben kell lennie, legalább 120 m² fő lakóterülettel, és a Golden Visa-ingatlant TILOS rövid távra (Airbnb-jelleggel) kiadni — a szabály megsértése az engedély visszavonásával és 50 000 eurós bírsággal jár.",
    introEn:
      "Greece runs the EU's best-known Golden Visa: real-estate investment grants a renewable five-year residence permit for the whole family with Schengen mobility and no minimum-stay requirement. Thresholds are now tiered by area.",
    highlightsHu: [
      "Golden Visa sávosan: 800 000 € (Attika, Thesszaloniki, Mükonosz, Szantorini, nagyobb szigetek) / 400 000 € (máshol) / 250 000 € (csak átminősítés vagy műemlék-felújítás)",
      "Az ingatlannak egyetlen egységnek kell lennie, min. 120 m² fő lakóterülettel",
      "A Golden Visa-ingatlant TILOS rövid távra kiadni — visszavonás és 50 000 € bírság a szankció",
      "NINCS minimális ottartózkodási kötelezettség",
      "A teljes családra kiterjed (házastárs, 21 év alatti gyermekek, mindkét fél eltartott szülei)",
      "5 évre szól, megújítható amíg a befektetés megmarad",
      "Ingatlanátírási adó 3% (+ csekély önkormányzati hozzájárulás)",
      "Új építésűnél az ÁFA felfüggesztése 2026. december 31-ig meghosszabbítva — ilyenkor is a 3% átírási adó jár"
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
        a: "Három sáv van az 5100/2024 törvény szerint. 800 000 € Attika egész régiójában, Thesszaloniki regionális egységében, Mükonoszon, Szantorinin és minden 3 100 főnél népesebb szigeten. 400 000 € az ország összes többi részén. 250 000 € kizárólag két esetben: ha nem lakáscélú épületet alakítanak lakóingatlanná (a beruházást a kérelem előtt be kell fejezni), vagy műemléki védettségű épületet újítanak fel. A 2024-es átmeneti határidők már mind lejártak, tehát 2026-ban a teljes 400/800 ezres küszöb érvényes. Vásárlás előtt mindig az adott ingatlan konkrét zónabesorolását kell ellenőrizni."
      },
      {
        q: "Kiadhatom rövid távra a görög Golden Visa-ingatlanomat?",
        a: "Nem. A 2024-es reform kifejezetten megtiltja a Golden Visa alapjául szolgáló ingatlan rövid távú (Airbnb-jellegű) bérbeadását. A tilalom megsértése a tartózkodási engedély visszavonását és 50 000 eurós bírságot von maga után. Hosszú távú bérbeadás megengedett. Ez a feltétel gyökeresen megváltoztatja a befektetés hozamszámítását, mégis a legtöbb ajánlatból hiányzik."
      },
      {
        q: "A görög Golden Visa állampolgárságot ad?",
        a: "Nem közvetlenül. A Golden Visa tartózkodási engedély; görög állampolgárságot hét év tényleges görögországi tartózkodás után lehet kérelmezni, nyelvi és integrációs feltételekkel. Ha a cél maga az útlevél, ingatlanbefektetéssel közvetlenül Törökország ad állampolgárságot."
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
      "Ingatlanátírási adó (ITP) régiónként kb. 6–11%: Madrid 6%, Andalúzia 7%, Katalónia 10–11%",
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
        a: "Nem. Spanyolország 2025 áprilisában megszüntette a Golden Visa ingatlanbefektetésen alapuló útját, így 500 000 eurós ingatlanvásárlással ma már nem szerezhető spanyol befektetői tartózkodási engedély. EU-n belül Görögország és Magyarország kínál ingatlanalapú letelepedési programot; állampolgárságot ingatlannal elsősorban Törökország ad."
      },
      {
        q: "Mennyi adót fizet a vevő Spanyolországban?",
        a: "Használt ingatlannál a régiótól függően kb. 6–11% átírási adó (ITP) terheli a vevőt: Madridban 6%, Andalúziában 7% egységesen, Katalóniában 10% egymillió euróig és 11% felette, Valenciában 10% (2026. június 1-től 9%, egymillió euró felett 11%). Az adó alapja a vételár és a hivatalos kataszteri referenciaérték közül a magasabb — ez fontos, mert alacsony szerződéses árnál is a referenciaérték után adóznak. Új építésű, fejlesztőtől vett ingatlannál 10% ÁFA plusz régiótól függő 0,5–1,5% okirati illeték (AJD) fizetendő."
      },
      {
        q: "Mire van szükség magyar vevőként spanyol ingatlanvásárláshoz?",
        a: "Spanyol adóazonosítóra (NIE), spanyol bankszámlára és jellemzően független ügyvédre. EU-állampolgárként semmilyen vásárlási korlátozás nem vonatkozik Önre, és a folyamat közjegyző előtt zárul (escritura pública)."
      }
    ]
  },
  AE: {
    name: "Dubai, UAE",
    nameHu: "Dubai (EAE)",
    inHu: "Dubajban",
    title: "Property for sale in Dubai, UAE",
    desc: "Verified freehold apartments and villas in Dubai — Dubai Marina, Downtown, Palm Jumeirah. No property tax, ~7% rental yields and a 10-year Golden Visa from AED 2M.",
    introHu:
      "Dubaj a Perzsa-öböl legnagyobb forgalmú, teljesen adómentes ingatlanpiaca: a külföldi vevő a kijelölt „freehold” övezetekben (Dubai Marina, Downtown, Palm Jumeirah, Business Bay) bármely nemzetiséggel, saját néven, tartózkodási engedély nélkül vásárolhat teljes értékű tulajdont. Nincs éves ingatlanadó, személyi jövedelemadó, tőkenyereség-adó és a magánszemély bérleti jövedelme sem adózik. A bruttó bérleti hozam városi átlagban 7% körüli — nemzetközi összevetésben kiemelkedő —, a 2 000 000 AED (~505 000 €) értékű ingatlan pedig 10 éves, megújítható Golden Visára jogosít. Fontos két dolog: a kijelölt övezeteken kívül külföldi nem vehet, ezért vásárlás előtt a konkrét ingatlan besorolását a Dubai Land Departmentnél kell ellenőrizni; az EAE pedig ingatlanért NEM ad állampolgárságot, csak tartózkodást.",
    introEn:
      "Dubai is the Gulf's highest-volume, entirely tax-free property market. In designated freehold areas (Dubai Marina, Downtown, Palm Jumeirah, Business Bay) foreigners of any nationality can buy full ownership in their own name, with no property tax, income tax or capital-gains tax, gross yields around 7%, and a renewable 10-year Golden Visa from AED 2M (~€505,000).",
    highlightsHu: [
      "Külföldi bármely nemzetiséggel, saját néven vehet FREEHOLD ingatlant a kijelölt övezetekben, tartózkodási engedély nélkül",
      "Nincs éves ingatlanadó, SZJA, tőkenyereség-adó és bérletiadó a magánszemély tulajdonosnak",
      "Ingatlanátírási illeték 4% (hivatalosan 2% vevő + 2% eladó; a gyakorlatban a vevő fizeti a teljeset)",
      "2 000 000 AED (~505 000 €) ingatlantól 10 éves, megújítható Golden Visa — a családtagokra is kiterjed",
      "A Golden Visa TARTÓZKODÁS, nem állampolgárság — az EAE ingatlanért nem ad útlevelet",
      "Városi átlagban ~7% bruttó bérleti hozam; a dirham a dollárhoz van rögzítve",
      "A kijelölt övezeteken kívül külföldi nem vásárolhat — az övezetet a DLD-nél kell ellenőrizni"
    ],
    keywords: [
      "ingatlan Dubai",
      "dubaji ingatlanbefektetés",
      "Dubai Golden Visa ingatlannal",
      "eladó lakás Dubai Marina",
      "Dubai property for sale",
      "buy property Dubai freehold",
      "Dubai real estate investment"
    ],
    faqHu: [
      {
        q: "Vehet külföldi ingatlant Dubajban?",
        a: "Igen. Külföldi magánszemély bármely nemzetiséggel, saját néven, tartózkodási engedély nélkül vásárolhat teljes értékű (freehold) ingatlant Dubaj kijelölt övezeteiben — ilyen például a Dubai Marina, a Downtown, a Palm Jumeirah és a Business Bay. Ezeken az övezeteken kívül viszont a tulajdon az EAE és a GCC állampolgárainak van fenntartva, ezért vásárlás előtt a konkrét ingatlan besorolását a Dubai Land Departmentnél (DLD) érdemes ellenőrizni."
      },
      {
        q: "Mennyi adót kell fizetni dubaji ingatlan után?",
        a: "A vásárláskor 4% ingatlanátírási illeték (DLD transfer fee) merül fel — hivatalosan 2% a vevő és 2% az eladó, a gyakorlatban azonban a vevő fizeti a teljes 4%-ot. Ezen felül van egy kb. 4 200 AED trustee-díj és 250 AED tulajdonilap-díj. A tulajdonlás viszont gyakorlatilag adómentes: nincs éves ingatlanadó, személyi jövedelemadó, tőkenyereség-adó, és a magánszemély lakóingatlan-bérleti jövedelme sem adózik."
      },
      {
        q: "Ad Dubaj tartózkodási engedélyt ingatlanvásárlásért?",
        a: "Igen. Legalább 2 000 000 AED (~505 000 €) értékű ingatlan 10 éves, megújítható Golden Visára jogosít, amely kiterjed a házastársra, a gyermekekre (kor nélkül) és a szülőkre is, és nincs minimális ottartózkodási követelmény. Jelzáloggal terhelt és bizonyos feltételekkel épülő (off-plan) ingatlan is elfogadható. Fontos: ez tartózkodási engedély, NEM állampolgárság — az EAE ingatlanbefektetésért nem ad útlevelet."
      },
      {
        q: "Lehet Dubajban ingatlannal állampolgárságot szerezni?",
        a: "Nem. Az Egyesült Arab Emírségeknek nincs ingatlanalapú állampolgársági programja. Az útlevél megszerzése kizárólag hatósági jelölés útján lehetséges (kiemelt befektetők, orvosok, tudósok, tehetségek számára), amit nem lehet megvásárolni és nem is lehet rá pályázni. Ingatlanbefektetéssel Dubajban a 10 éves Golden Visa (tartózkodás) a legtöbb, ami elérhető; állampolgárságot ingatlannal a portfóliónkban Törökország kínál."
      },
      {
        q: "Mekkora bérleti hozamot lehet elérni Dubajban?",
        a: "A dubaji lakások bruttó bérleti hozama városi átlagban 7% körül alakul (2026 közepén független adatok szerint kb. 6,9–7,2%), ami nemzetközi összevetésben kiemelkedő. A megfizethetőbb, feltörekvő övezetekben (például Jumeirah Village Circle, Dubai Sports City) 7,5–8,5% is elérhető, míg a prémium lokációkban (Downtown, Palm Jumeirah) 5–6%. A nettó hozamból le kell vonni a közös költséget (service charge), amely lokációtól függően jelentős lehet."
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
