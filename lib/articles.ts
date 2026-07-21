import type { CountryCode } from "./types";
import { COUNTRIES, COUNTRY_BY_CODE, GOLDEN_VISA_COUNTRIES } from "./geo";
import { COUNTRY_SEO, transferTaxPct, type FaqItem } from "./seo";
import { FOREIGN_BUYER } from "./legal";

/**
 * Tartalom-hub (/tudastar).
 *
 * Miért van erre szükség: egy hirdetési oldal önmagában szinte soha nem
 * rangsorol az „állampolgárság ingatlanbefektetéssel” vagy a „montenegrói
 * ingatlanbefektetés" típusú, INFORMÁCIÓS keresésekre — ezekre cikk kell. Az
 * LLM-ek (ChatGPT, Claude, Perplexity) is szinte kizárólag ilyen, tagolt,
 * tényszerű, hivatkozható szöveget idéznek.
 *
 * A cikkek két forrásból állnak:
 *  1. PILLÉR-cikkek: kézzel írt, nagy keresési volumenű témák (állampolgárság,
 *     Golden Visa, mellékköltségek, folyamat).
 *  2. ORSZÁG-KALAUZOK: a lib/seo.ts és lib/legal.ts adataiból generálva, így
 *     minden ország kap egyedi, adatvezérelt cikket, és nincs adat-drift.
 */

export interface ArticleSection {
  h: string;
  p: string[];
  /** Opcionális összehasonlító táblázat (fejléc + sorok). */
  table?: { head: string[]; rows: string[][] };
  /** Opcionális illusztráló kép: nyelvfüggetlen `src`, kulcsszavas `alt`. */
  img?: { src: string; alt: string };
}

export interface Article {
  slug: string;
  title: string;
  /** Meta description + a hub kártya szövege. */
  description: string;
  /** Egymondatos, önmagában is idézhető válasz — LLM-eknek és a kiemelt találatnak. */
  answer: string;
  category: "citizenship" | "golden-visa" | "guide" | "country";
  /** Országkalauznál a zászló; pillér-cikknél üres (ott `icon` van). */
  emoji: string;
  /** Pillér-cikk ikonja a rendszer saját készletéből (components/ui/Icon). */
  icon?: string;
  /** ISO dátum — az Article JSON-LD dateModified mezője. */
  updated: string;
  readMinutes: number;
  country?: CountryCode;
  sections: ArticleSection[];
  faq: FaqItem[];
  keywords: string[];
}

const UPDATED = "2026-07-19";

const fmtEur = (n: number) => `${new Intl.NumberFormat("hu-HU").format(n)} €`;

/* ------------------------------------------------------------------ *
 * 1. PILLÉR-CIKKEK
 * ------------------------------------------------------------------ */

/** Azok az országok, ahol ingatlannal ÁLLAMPOLGÁRSÁG szerezhető (jelenleg: Törökország). */
const CITIZENSHIP_COUNTRIES = COUNTRIES.filter((c) => c.goldenVisa?.kind === "citizenship");
/** Ahol ingatlannal (csak) letelepedés szerezhető. */
const RESIDENCE_COUNTRIES = GOLDEN_VISA_COUNTRIES.filter((c) => c.goldenVisa?.kind === "residence");

const PILLARS: Article[] = [
  {
    slug: "allampolgarsag-ingatlanbefektetessel",
    title: "Állampolgárság ingatlanbefektetéssel: hol lehet valóban útlevelet szerezni?",
    description:
      "Melyik országban ad ingatlanvásárlás közvetlenül állampolgárságot? A török program küszöbei, határidői és buktatói, és miért nem ad EU-s állampolgárságot egyetlen Golden Visa sem.",
    answer:
      "Ingatlanbefektetéssel közvetlenül állampolgárság — nem csak tartózkodás — ma elsősorban Törökországban szerezhető: 400 000 USD értékű ingatlannal, a teljes családra kiterjedően, jellemzően 3–6 hónap alatt, letelepedési kötelezettség nélkül. Néhány Karib-tengeri ország is működtet hasonló programot. Minden EU-s út — a görög, a magyar vagy a korábbi spanyol Golden Visa — ezzel szemben csak tartózkodási engedélyt ad, nem állampolgárságot.",
    category: "citizenship",
    emoji: "🛂",
    icon: "shield",
    updated: UPDATED,
    readMinutes: 7,
    keywords: [
      "állampolgárság ingatlanbefektetéssel",
      "citizenship by investment ingatlan",
      "második útlevél befektetéssel",
      "török állampolgárság ingatlan",
      "hogyan szerezhető állampolgárság ingatlanvásárlással",
      "ingatlanért állampolgárság 2026",
      "török útlevél 400000 USD ingatlan",
      "karibi állampolgársági program ingatlan",
      "EU állampolgárság ingatlanvásárlással",
      "citizenship by investment vs golden visa"
    ],
    sections: [
      {
        h: "A legfontosabb különbség: állampolgárság vagy csak tartózkodás?",
        p: [
          "A „Golden Visa” kifejezést a piac két, jogilag teljesen eltérő dologra használja, és a legtöbb félreértés is ebből ered. A tartózkodási program (residence by investment) letelepedési engedélyt ad: élhet, jöhet-mehet az adott országban, de az útlevele nem változik. Az állampolgársági program (citizenship by investment, CBI) viszont valódi állampolgárságot és útlevelet ad, jellemzően néhány hónap alatt, letelepedés nélkül.",
          "Ingatlanbefektetéssel közvetlenül állampolgárságot ma nagy, likvid piaccal és gyors eljárással Törökország kínál — ezért a Proopify portfóliójában ez a citizenship-by-investment út. Néhány Karib-tengeri ország is működtet ingatlanalapú állampolgársági programot, de azok kis, program-vezérelt piacok, lassabb kilépéssel. Az EU-ban NINCS ilyen program: a máltai állampolgársági programot az Európai Bíróság 2025-ös ítélete nyomán le kellett állítani, a görög és a magyar program pedig kizárólag tartózkodási engedélyről szól."
        ]
      },
      {
        h: "Törökország: ingatlanból állampolgárság 3–6 hónap alatt",
        p: [
          "A világ legnagyobb volumenű, ingatlanalapú állampolgársági programja Törökországé. A feltétel: legalább 400 000 USD értékű török ingatlan megvásárlása, amelyet három évig meg kell tartani — ezt „satılamaz” (nem eladható) bejegyzésként a tulajdoni lapra (tapu) is rávezetik. Ezután a kérelmező tartózkodási engedélyt, majd állampolgárságot kap, jellemzően 3–6 hónap alatt. A program kiterjed a házastársra és a 18 év alatti gyermekekre; felnőtt gyermek és szülő nem vonható be."
        ],
        table: {
          head: ["Szempont", "Törökország 🇹🇷"],
          rows: [
            ["Amit kap", "Teljes állampolgárság + útlevél"],
            ["Ingatlan-küszöb", "400 000 USD (~370 000 €)"],
            ["Eljárás ideje", "3–6 hónap"],
            ["Tartási idő", "3 év"],
            ["Ottartózkodás", "Nem kötelező"],
            ["Bevonható család", "Házastárs + 18 alatti gyermekek"],
            ["Vízummentes országok", "kb. 118"],
            ["Extra előny", "Jogosultság az USA E-2 befektetői vízumára"],
            [`Vásárlás mellékköltsége`, `${transferTaxPct("TR")} tapu-illeték + ügyvéd, értékbecslés`]
          ]
        }
      },
      {
        h: "A buktató, amit a hirdetések elhallgatnak: az értékbecslés",
        p: [
          "A leggyakoribb hiba a török programnál az, hogy a vevő a szerződéses árat nézi. Pedig nem az számít, hanem az SPK-engedélyes értékbecslő hivatalos értékbecslése — és a 400 000 USD-s küszöböt EGYSZERRE kell elérnie a bankon át igazoltan kifizetett árnak, az értékbecslésnek és a tulajdoni lapon szereplő értéknek. Magas szerződéses árral nem lehet alacsony értékbecslést „kijavítani”, és a küszöböt USD-ben mérik, tehát az árfolyam is számít.",
          "A másik gyakori félreértés az amerikai E-2 vízum körül van. Igaz, hogy a török állampolgár — a magyarral ellentétben — jogosulttá válik az E-2 befektetői vízum kérelmezésére. De az E-2 nem letelepedési engedély és nem zöldkártya, hanem befektetéshez kötött, megújítandó nem-bevándorló vízum, és a honosított állampolgároknál a gyakorlatban több éves állampolgárságot várnak el hozzá."
        ]
      },
      {
        h: "Amit a döntés előtt mindenképp tisztázzon",
        p: [
          "1. Az értékbecslés megfelel-e a küszöbnek — Törökországban nem a szerződéses ár, hanem a hivatalos SPK-értékbecslés számít.",
          "2. Az adóügyi következmények a saját illetőségében: az állampolgárság megszerzése önmagában nem szünteti meg a magyar adóügyi illetőséget.",
          "3. A kilépés: a hároméves tartási idő után milyen valós áron adható tovább az ingatlan. Ez a CBI-befektetések leggyakrabban alulbecsült kockázata.",
          "4. Ha nem a fő cél az útlevél, hanem az EU-s letelepedés: akkor nem CBI-t, hanem Golden Visát kell keresni — erről külön cikkünk szól."
        ]
      }
    ],
    faq: [
      {
        q: "Melyik országban lehet ingatlanvásárlással állampolgárságot szerezni?",
        a: "Nagy, likvid ingatlanpiaccal és gyors eljárással elsősorban Törökországban: 400 000 USD értékű ingatlannal, a teljes családra kiterjedően, jellemzően 3–6 hónap alatt, letelepedési kötelezettség nélkül. Néhány Karib-tengeri ország is működtet ingatlanalapú állampolgársági programot, de azok kis, kevésbé likvid piacok. EU-tagállamban ingatlannal közvetlenül állampolgárságot nem lehet szerezni."
      },
      {
        q: "Lehet EU-s állampolgárságot szerezni ingatlanbefektetéssel?",
        a: "Nem. Jelenleg egyetlen EU-tagállamban sem lehet ingatlanvásárlással közvetlenül állampolgárságot szerezni. A görög és a magyar program tartózkodási engedélyt ad, a spanyol ingatlanalapú Golden Visa 2025 áprilisában megszűnt, a máltai állampolgársági programot pedig az Európai Bíróság 2025-ös ítélete nyomán le kellett állítani."
      },
      {
        q: "Meg kell tartani az ingatlant az állampolgárság megszerzése után?",
        a: "Igen, egy ideig. Törökországban három évig nem adható el az ingatlan (ezt a tulajdoni lapra is bejegyzik). Az állampolgárság ezután, az ingatlan eladása után is megmarad — a török állampolgárságot nem vonják vissza az értékesítés miatt."
      },
      {
        q: "Elveszítem a magyar állampolgárságomat?",
        a: "Nem. Magyarország elfogadja a kettős állampolgárságot, és Törökország sem követeli meg a korábbi állampolgárságról való lemondást. Az adóügyi illetőség kérdése viszont ettől független — ezt érdemes adószakértővel tisztázni."
      }
    ]
  },
  {
    slug: "golden-visa-ingatlannal",
    title: "Golden Visa ingatlanbefektetéssel 2026-ban: melyik ország mit ad?",
    description:
      "Görögország, Magyarország és a többi program: küszöbök, ottartózkodási feltételek és az, hogy melyik út vezet állampolgársághoz. Friss, összehasonlító áttekintés.",
    answer:
      "KÖZVETLEN ingatlanvásárlással ma az EU-ban gyakorlatilag csak Görögországban lehet letelepedési engedélyt szerezni: 400 000 €-tól az ország nagy részén, 800 000 €-tól Attikában, Thesszalonikiben és a népszerű szigeteken. A magyar vendégbefektetői programban a közvetlen lakásvásárlás NEM jogosít — ott csak ingatlanalap befektetési jegye (250 000 €) vagy felsőoktatási adomány (1 000 000 €) számít. A spanyol ingatlanalapú Golden Visa 2025. április 3-án megszűnt, Olaszországban pedig az ingatlan kifejezetten ki van zárva a befektetői vízumból. Ha a cél maga az útlevél, nem tartózkodási program kell, hanem állampolgársági — ezt ingatlannal elsősorban Törökország kínálja.",
    category: "golden-visa",
    emoji: "🪪",
    icon: "globe",
    updated: UPDATED,
    readMinutes: 7,
    keywords: [
      "golden visa ingatlannal",
      "golden visa ingatlanbefektetéssel",
      "görög golden visa",
      "görög golden visa küszöb 2026",
      "magyar vendégbefektetői program",
      "EU letelepedés ingatlanvásárlással",
      "golden visa 2026",
      "melyik országban van golden visa ingatlannal",
      "spanyol golden visa megszűnt",
      "golden visa vagy állampolgárság",
      "letelepedési engedély ingatlanvásárlással"
    ],
    sections: [
      {
        h: "Mit ad valójában egy Golden Visa?",
        p: [
          "A Golden Visa tartózkodási engedély, amelyet befektetésért — jellemzően ingatlanvásárlásért — cserébe ad az állam. EU-s programnál ez schengeni szabad mozgást is jelent, tehát a legtöbb esetben vízummentes utazást az egész övezetben. Amit NEM ad: útlevelet és állampolgárságot. Állampolgárságot a legtöbb országban csak több éves tényleges ottlakás, nyelvvizsga és honosítási eljárás után lehet kérni.",
          "Magyar állampolgárként az EU-n belüli szabad mozgáshoz nincs szüksége Golden Visára — ezért a hazai vevőknél ezek a programok elsősorban adótervezési, üzleti vagy „B-terv” megfontolásból érdekesek, illetve harmadik országbeli családtagok esetén."
        ]
      },
      {
        h: "A programok egymás mellett",
        p: ["A küszöbök az adott ország hivatalos, ingatlanalapú belépési szintjét mutatják."],
        table: {
          head: ["Ország", "Küszöb", "Amit ad", "Ottartózkodás"],
          rows: [
            [
              "Görögország 🇬🇷",
              "800 000 € (Attika, Thesszaloniki, nagy szigetek) / 400 000 € (máshol) / 250 000 € (csak átminősítés, műemlék)",
              "5 éves, megújítható tartózkodási engedély, teljes családra",
              "Nem kötelező"
            ],
            [
              "Magyarország 🇭🇺",
              "250 000 € ingatlanALAP-jegy vagy 1 000 000 € adomány",
              "10 éves engedély — KÖZVETLEN lakásvásárlás NEM jogosít",
              "Nem kötelező"
            ],
            [
              "Spanyolország 🇪🇸",
              "—",
              "MEGSZŰNT: az ingatlanalapú út 2025. április 3-án lezárult",
              "—"
            ],
            [
              "Olaszország 🇮🇹",
              "—",
              "NINCS: az ingatlan ki van zárva a befektetői vízumból",
              "—"
            ],
            [
              "Törökország 🇹🇷",
              "400 000 USD",
              "ÁLLAMPOLGÁRSÁG (nem csak tartózkodás)",
              "Nem kötelező"
            ]
          ]
        }
      },
      {
        h: "Görögország: a legismertebb EU-s program",
        p: [
          "A görög Golden Visa öt évre szól, megújítható amíg a befektetés megmarad, és kiterjed a házastársra, a 21 év alatti gyermekekre és mindkét fél eltartott szüleire. A legerősebb tulajdonsága, hogy nincs minimális ottartózkodási követelmény.",
          "A küszöb az 5100/2024 törvény óta három sávos. 800 000 € Attika egész régiójában, Thesszaloniki regionális egységében, Mükonoszon, Szantorinin és minden 3 100 főnél népesebb szigeten. 400 000 € az ország összes többi részén. 250 000 € kizárólag két esetben: nem lakáscélú épület lakássá alakításánál (a beruházást a kérelem benyújtása ELŐTT be kell fejezni), illetve műemléki védettségű épület felújításánál. A 2024-es átmeneti határidők mind lejártak, tehát 2026-ban a teljes küszöb érvényes.",
          "Két feltétel, ami a legtöbb ajánlatból hiányzik, mégis eldöntheti a befektetést: a 400 és 800 ezer eurós sávban az ingatlannak EGYETLEN egységnek kell lennie, legalább 120 m² fő lakóterülettel (a befektetés nem osztható szét több lakásra), és a Golden Visa alapjául szolgáló ingatlant TILOS rövid távra, Airbnb-jelleggel kiadni. A tilalom megsértése az engedély visszavonását és 50 000 eurós bírságot von maga után. Aki a görög programot turisztikai bérbeadási hozamra tervezte, annak ez alapjaiban írja át a számítást."
        ]
      },
      {
        h: "Magyarország: a 2024-ben újraindított vendégbefektetői program",
        p: [
          "Itt a legfontosabb tisztázni egy elterjedt félreértést: a magyar Vendégbefektetői Programban KÖZVETLEN LAKÁSVÁSÁRLÁS NEM JOGOSÍT tartózkodási engedélyre. A jogszabály eredetileg tervezett 500 000 eurós közvetlen ingatlan-opcióját 2025 januárjában törölték, még mielőtt hatályba lépett volna. Aki tehát egyszerűen vesz egy budapesti lakást, attól nem kap vendégbefektetői engedélyt.",
          "Két út maradt. Az egyik 250 000 € értékű befektetési jegy vásárlása egy MNB-nél nyilvántartott ingatlanalapban, amelynek nettó eszközértéke legalább 40%-ban magyar lakóingatlanban van, öt éves tartási kötelezettséggel. A másik 1 000 000 € vissza nem térítendő adomány magyar felsőoktatási intézménynek. Az engedély tíz évre szól és egyszer további tíz évvel hosszabbítható — futamidőben ez a leghosszabb az EU-ban —, a befektetést pedig a vendégbefektetői vízummal való első beutazástól számított 93 napon belül teljesíteni kell.",
          "Magyar és EU-állampolgárnak ez a program értelemszerűen nem releváns, hiszen szabad mozgás illeti meg; célközönsége a harmadik országbeli befektető."
        ]
      },
      {
        h: "Ha a cél az útlevél, ne Golden Visát keressen",
        p: [
          "A leggyakoribb hiba, hogy valaki állampolgárságot szeretne, és Golden Visát vásárol hozzá. A kettő nem ugyanaz és nem is vezet automatikusan egymásba: a görög honosításhoz például hét év tényleges görögországi tartózkodás, nyelvvizsga és integrációs vizsga kell — a Golden Visa önmagában ezt nem pótolja.",
          "Ha a valódi cél a második útlevél, akkor nem tartózkodási, hanem állampolgársági programot kell választani — ingatlannal ezt elsősorban Törökország kínálja. Erről részletesen az „Állampolgárság ingatlanbefektetéssel” cikkünkben írtunk."
        ]
      }
    ],
    faq: [
      {
        q: "Melyik országban lehet ma Golden Visát kapni ingatlanvásárlással?",
        a: "Közvetlen ingatlanvásárlással gyakorlatilag csak Görögországban: 400 000 eurótól az ország nagy részén, 800 000 eurótól Attikában, Thesszalonikiben és a népszerű szigeteken, 250 000 eurótól pedig kizárólag épület-átminősítésnél vagy műemlék-felújításnál. A magyar programban a közvetlen lakásvásárlás nem számít — ott ingatlanalap-befektetési jegy (250 000 €) vagy felsőoktatási adomány (1 000 000 €) kell. A spanyol ingatlanalapú Golden Visa 2025. április 3-án megszűnt, Olaszországban pedig az ingatlan ki van zárva a befektetői vízumból."
      },
      {
        q: "A Golden Visa ad EU-s állampolgárságot?",
        a: "Nem. A Golden Visa tartózkodási engedély. Állampolgárságot csak a szokásos honosítási eljárásban lehet szerezni, ami jellemzően több éves tényleges ottlakást, nyelvvizsgát és integrációs vizsgát követel — a görög esetben például hét évet."
      },
      {
        q: "Kell az országban élni a Golden Visa megtartásához?",
        a: "A görög és a magyar programnál nincs minimális ottartózkodási követelmény: elég, ha a befektetést megtartja és az engedélyt megújítja. Ez ugyanakkor azt is jelenti, hogy ezek az évek nem számítanak bele a honosításhoz szükséges tartózkodási időbe — a görög honosításhoz például hét év TÉNYLEGES görögországi tartózkodás kell."
      }
    ]
  },
  {
    slug: "kulfoldi-ingatlan-mellekkoltsegek",
    title: "Mennyibe kerül valójában? Külföldi ingatlanvásárlás mellékköltségei 12 országban",
    description:
      "Átírási adó, közjegyző, ügyvéd, közvetítői jutalék — országonkénti bontásban. A vételáron felüli teljes költség jellemzően 3–14% között mozog.",
    answer:
      "A külföldi ingatlanvásárlás vételáron felüli mellékköltsége országonként jelentősen eltér: Albániában gyakorlatilag nincs átírási adó, Montenegróban 3%, Magyarországon és Törökországban 4%, míg Olaszországban 9% (második otthon) és Spanyolországban 6–10%. Ehhez mindenütt hozzájön a közjegyzői díj, az ügyvédi díj és jellemzően 2–5% közvetítői jutalék.",
    category: "guide",
    emoji: "🧾",
    icon: "wallet",
    updated: UPDATED,
    readMinutes: 6,
    keywords: [
      "ingatlanvásárlás mellékköltsége külföldön",
      "átírási adó külföldi ingatlan",
      "külföldi ingatlanvásárlás költségei",
      "property purchase costs Europe",
      "ingatlan illeték Horvátország Montenegró",
      "mennyibe kerül külföldi ingatlanvásárlás",
      "közjegyzői és ügyvédi díj ingatlan külföld",
      "ingatlanközvetítői jutalék külföldön ki fizeti",
      "új építésű ingatlan áfa Spanyolország Olaszország",
      "montenegrói ingatlan illeték 2026"
    ],
    sections: [
      {
        h: "Miért fontosabb ez, mint a vételár",
        p: [
          "A külföldi ingatlanvásárlásnál a legtöbb kellemetlen meglepetés nem az árban, hanem a mellékköltségben van. A vételáron felül jellemzően 5–14% jön még, országtól függően — egy 300 000 eurós ingatlannál ez 15 000 és 42 000 euró közötti különbség pusztán attól függően, melyik országban vesz.",
          "Az alábbi táblázat országonként mutatja a legfontosabb tételeket. Fontos: az átírási adó jellemzően a HASZNÁLT ingatlanra vonatkozik — új építésűnél sok országban ÁFA lép a helyébe, ami magasabb lehet."
        ],
        table: {
          head: ["Ország", "Átírási adó", "Közjegyző", "Ügyvéd", "Közvetítő"],
          rows: COUNTRIES.map((c) => [
            `${c.flag} ${COUNTRY_SEO[c.code].nameHu}`,
            transferTaxPct(c.code),
            `${Math.round(c.costs.notaryRate * 1000) / 10}% + ${c.costs.notaryFixed} €`,
            `${Math.round(c.costs.lawyerRate * 1000) / 10}%`,
            `${Math.round(c.costs.agencyRate * 1000) / 10}%`
          ])
        }
      },
      {
        h: "A legolcsóbb és a legdrágább belépő",
        p: [
          `A legkedvezőbb tranzakciós költséget Albánia kínálja, ahol a vevő egyáltalán nem fizet értékarányos átírási adót, majd Thaiföld (${transferTaxPct("TH")}) és Szerbia (${transferTaxPct("RS")}) következik. Horvátországban fix ${transferTaxPct("HR")} az illeték. Montenegró 2024 óta SÁVOS rendszert alkalmaz: 150 000 €-ig 3%, efölött 5%, 500 000 € felett 6% — egy 600 000 eurós ingatlannál tehát nem 18 000, hanem 28 000 € az adó. A skála másik végén Olaszország áll ${transferTaxPct("IT")}-kal második otthon esetén, valamint Spanyolország, ahol a regionális ITP kb. 6–11% között mozog.`,
          "Egy gyakori tévedés, hogy a közvetítői jutalékot mindig az eladó fizeti. Ez piaconként eltér: a balkáni és a török piacon a jutalék megosztása vagy vevői viselése is bevett, ezért ezt a foglaló előtt írásban kell tisztázni."
        ]
      },
      {
        h: "Amivel a táblázaton felül számolni kell",
        p: [
          "Fordítás és hitelesítés: a szerződéseket sok országban hiteles fordítással kell benyújtani.",
          "Adóazonosító és bankszámla: Spanyolországban NIE, Olaszországban codice fiscale, Görögországban AFM szükséges — ezek nélkül nem lehet szerződni.",
          "Éves fenntartás: ingatlanadó, közös költség, biztosítás, és nyaralóingatlannál a téliesítés vagy a kezelői díj.",
          "Devizaváltás: nem euróövezeti országoknál (Törökország, Thaiföld, Indonézia, Magyarország) a banki váltási marzs önmagában 1–3% is lehet — érdemes külön devizaszolgáltatót használni."
        ]
      }
    ],
    faq: [
      {
        q: "Mennyi a külföldi ingatlanvásárlás teljes mellékköltsége?",
        a: "Országtól függően jellemzően a vételár 5–14%-a. A legalacsonyabb Albániában és Thaiföldön (kb. 3–6%), közepes Montenegróban, Horvátországban, Magyarországon és Törökországban (kb. 5–9%), a legmagasabb Olaszországban és Spanyolországban (kb. 10–14%)."
      },
      {
        q: "Ki fizeti a közvetítői jutalékot külföldi ingatlanvásárlásnál?",
        a: "Piaconként eltér. Nyugat-európai piacokon jellemzően az eladó, a balkáni és a török piacon viszont bevett a megosztás vagy a vevői viselés is. Mindig a foglaló megfizetése ELŐTT kell írásban tisztázni."
      },
      {
        q: "Új építésűnél is fizetni kell átírási adót?",
        a: "Általában nem — a legtöbb országban a fejlesztőtől vett új ingatlan árában ÁFA szerepel, és ilyenkor nincs külön átírási adó. Ez azonban nem feltétlenül olcsóbb: a spanyol 10% vagy az olasz 10–22% ÁFA magasabb lehet, mint a használt ingatlan átírási adója."
      }
    ]
  },
  {
    slug: "kulfoldi-ingatlanvasarlas-lepesei",
    title: "Külföldi ingatlanvásárlás lépésről lépésre: a teljes folyamat",
    description:
      "A kereséstől a tulajdoni bejegyzésig: átvilágítás, foglaló, előszerződés, közjegyző, adóazonosító és a leggyakoribb hibák, amelyek pénzbe kerülnek.",
    answer:
      "A külföldi ingatlanvásárlás hat lépésből áll: (1) keresés és szűkítés, (2) helyi adóazonosító és bankszámla nyitása, (3) független ügyvéddel végzett jogi átvilágítás a tulajdoni lapon, (4) előszerződés és foglaló (jellemzően 10%), (5) végleges szerződés közjegyző előtt és a vételár kifizetése, (6) tulajdoni bejegyzés a kataszterben. A teljes folyamat jellemzően 4–12 hét.",
    category: "guide",
    emoji: "🧭",
    icon: "compass",
    updated: UPDATED,
    readMinutes: 7,
    keywords: [
      "külföldi ingatlanvásárlás menete",
      "hogyan vegyek ingatlant külföldön",
      "ingatlan átvilágítás külföldön",
      "külföldi ingatlan vásárlás lépései",
      "külföldi ingatlanvásárlás lépésről lépésre",
      "előszerződés foglaló külföldi ingatlan",
      "adóazonosító NIE codice fiscale AFM",
      "meddig tart külföldi ingatlanvásárlás",
      "távolról ingatlanvásárlás meghatalmazással",
      "due diligence ingatlan külföld"
    ],
    sections: [
      {
        h: "1. Keresés és szűkítés",
        p: [
          "A leggyakoribb hiba, hogy a vevő az ingatlanba szeret bele, nem a piacba. Először a célt kell eldönteni: bérbeadási hozam, saját használat, vagy tartózkodási/állampolgársági program. Ez a három cél gyakran teljesen más országot és más ingatlantípust indokol.",
          "Hozamcélnál a városi, egész éves bérleti kereslet (Belgrád, Budapest, Bangkok) kiszámíthatóbb, mint a szezonális tengerpart. Saját használatnál a repülőjárat-elérhetőség és a téli kihasználtság dönt. Programcélnál pedig az ingatlan jogosultsága fontosabb, mint a fekvése."
        ]
      },
      {
        h: "2. Helyi adóazonosító és bankszámla",
        p: [
          "Szinte minden országban szükség van helyi adóazonosítóra a szerződéshez: Spanyolországban NIE, Olaszországban codice fiscale, Görögországban AFM, Törökországban vergi numarası. Ezek beszerzése 1–3 hét, és sok esetben meghatalmazással, távolról is intézhető.",
          "A helyi bankszámla nemcsak a vételár, hanem a későbbi rezsi és adó fizetése miatt is szükséges. Készüljön fel a pénzmosás elleni ellenőrzésre: a vételár eredetét dokumentumokkal kell igazolni."
        ]
      },
      {
        h: "3. Jogi átvilágítás — itt spórolni a legdrágább hiba",
        p: [
          "Fogadjon független ügyvédet, akit NEM az eladó vagy a közvetítő ajánlott. Az átvilágítás minimuma: tulajdoni lap (ki a bejegyzett tulajdonos), terhek és jelzálogok, építési és használatbavételi engedély, a telek besorolása, közös költség és adótartozás, valamint hogy a lakás alapterülete megegyezik-e a hirdetettel.",
          "Fejlesztőtől vett, még épülő ingatlannál külön kérdés a banki garancia vagy letéti szerkezet: mi történik a befizetett pénzzel, ha a fejlesztő nem fejezi be az építkezést."
        ]
      },
      {
        h: "4. Előszerződés és foglaló",
        p: [
          "A bevett gyakorlat: az előszerződéssel egyidejűleg 10% foglaló, amely az eladó szerződésszegése esetén jellemzően duplán jár vissza, a vevő visszalépésekor viszont elveszik. A foglalót lehetőleg ügyvédi letétbe fizesse, ne közvetlenül az eladónak.",
          "Az előszerződésben rögzíteni kell a végleges szerződés határidejét, az ingatlan pontos állapotát és tartozékait, valamint azt, hogy ki viseli az egyes mellékköltségeket."
        ]
      },
      {
        h: "5. Végleges szerződés és fizetés",
        p: [
          "A legtöbb európai piacon a végleges adásvétel közjegyző előtt zajlik (escritura, atto notarile, ugovor), aki ellenőrzi a felek azonosságát és a jogcímet. Törökországban a tulajdonátruházás a földhivatalban (tapu) történik.",
          "A vételárat lehetőleg banki átutalással, dokumentált módon fizesse — a készpénzes fizetés több országban korlátozott vagy tiltott, és megnehezíti a későbbi eladásnál a szerzési érték igazolását."
        ]
      },
      {
        h: "6. Bejegyzés és utómunkák",
        p: [
          "A tulajdonjog akkor válik teljessé, amikor a kataszter bejegyzi. Ez országonként néhány naptól néhány hónapig tart. Utána következik a közművek átírása, a helyi ingatlanadó bejelentése, és — ha bérbe ad — a bérbeadási engedély vagy kategóriába sorolás intézése.",
          "Végül: rendezze a magyar adózást is. A külföldi ingatlanból származó bérleti jövedelem és a későbbi eladás árfolyamnyeresége a kettős adóztatás elkerüléséről szóló egyezmények szerint adózik — ez országonként eltér, és nem mindig a külföldi adó zárja le a kérdést."
        ]
      }
    ],
    faq: [
      {
        q: "Mennyi ideig tart egy külföldi ingatlanvásárlás?",
        a: "Jellemzően 4–12 hét az elfogadott ajánlattól a tulajdoni bejegyzésig, ha készpénzes a vétel. A helyi adóazonosító beszerzése 1–3 hét, a jogi átvilágítás 1–2 hét, a közjegyzői zárás pedig a felek időzítésétől függ."
      },
      {
        q: "Kell ügyvédet fogadni külföldi ingatlanvásárláskor?",
        a: "Igen, és lehetőleg olyat, akit nem az eladó vagy a közvetítő ajánlott. A közjegyző a legtöbb országban a szerződés jogszerűségét ellenőrzi, de nem az Ön érdekeit képviseli — a terhek, engedélyek és az alapterület ellenőrzése az ügyvéd feladata."
      },
      {
        q: "Lehet távolról, személyes megjelenés nélkül vásárolni?",
        a: "A legtöbb országban igen, ügyvédnek adott, hitelesített és apostille-lal ellátott meghatalmazással. A gyakorlatban azért érdemes legalább egyszer személyesen megnézni az ingatlant — a fényképek szisztematikusan szebbek a valóságnál."
      }
    ]
  },
  {
    slug: "berleti-hozam-rangsor",
    title: "Bérleti hozam rangsor: hol a legmagasabb 12 országban?",
    description:
      "Melyik országban éri meg legjobban bérbeadásra ingatlant venni? A 12 piac bruttó bérleti hozama egy táblázatban, a szezonalitás és a kockázatok jelzésével.",
    answer:
      "A legmagasabb bruttó bérleti hozamot Bali (6–9%), Dubaj (~7%) és a feltörekvő balkáni-török városi piacok (5–8%) kínálják. Az érett nyugat-európai piacok (Olaszország, Spanyolország) alacsonyabb, 3–5%-os hozamúak, cserébe stabilabbak és likvidebbek. A bruttó szám azonban félrevezető: a valós, kezelési és adóköltségekkel csökkentett NETTÓ hozam jellemzően 2–4 százalékponttal alacsonyabb.",
    category: "guide",
    emoji: "📈",
    icon: "trendUp",
    updated: "2026-07-21",
    readMinutes: 6,
    keywords: [
      "bérleti hozam külföldi ingatlan",
      "hol a legmagasabb bérleti hozam",
      "ingatlan hozam rangsor 2026",
      "rental yield comparison",
      "melyik országban éri meg ingatlant venni",
      "bruttó és nettó bérleti hozam különbség",
      "airbnb hozam külföldi ingatlan",
      "legjobb bérleti hozam ország 2026",
      "tengerparti ingatlan bérbeadás hozam",
      "passzív jövedelem külföldi ingatlanból"
    ],
    sections: [
      {
        h: "Bruttó bérleti hozam országonként",
        p: [
          "A bruttó bérleti hozam az éves bérleti bevétel osztva a vételárral. Ez a leggyakrabban hirdetett szám, de a valós megtérülést a nettó hozam mutatja (a kezelés, karbantartás, adó és üresedés levonása után). A táblázat a városi átlagos, indikatív bruttó hozamokat mutatja — mindig a konkrét ingatlanra kell újraszámolni."
        ],
        table: {
          head: ["Ország", "Bruttó hozam", "Jelleg"],
          rows: [
            ["🇮🇩 Bali (Indonézia)", "6–9%", "Turisztikai, magas de erősen szezonális"],
            ["🇦🇪 Dubai (EAE)", "~7%", "Városi, adómentes; nagy kínálat"],
            ["🇦🇱 Albánia", "6–8%", "Feltörekvő tengerparti turizmus"],
            ["🇹🇷 Törökország", "5–8%", "Városi + turisztikai"],
            ["🇹🇭 Thaiföld", "5–7%", "Turisztikai társasházi"],
            ["🇷🇸 Szerbia", "4–6%", "Egész éves városi bérlet"],
            ["🇭🇺 Magyarország", "4–6%", "Egyetemi és városi kereslet"],
            ["🇬🇷 Görögország", "4–6%", "Athén + szigetek"],
            ["🇲🇪 Montenegró", "4–6%", "Szezonális parti"],
            ["🇪🇸 Spanyolország", "4–6%", "Likvid nyaralópiac"],
            ["🇭🇷 Horvátország", "3–5%", "Erősen szezonális (nyár)"],
            ["🇮🇹 Olaszország", "3–4%", "Érett, stabil piac"]
          ]
        }
      },
      {
        h: "Miért fontosabb a nettó hozam a bruttónál?",
        p: [
          "A turisztikai (rövid távú) bérbeadásnál a bruttó és a nettó hozam között óriási a különbség. A professzionális villamenedzsment 15–20%-ot visz el, ehhez jön a karbantartás, a takarítás, a közvetítői platform díja (Airbnb/Booking 3–15%) és az üresedés. Balin a 6–9% bruttó reálisan 3–5% nettóra csökken.",
          "A hosszú távú, városi bérbeadás (Belgrád, Budapest) kiszámíthatóbb: alacsonyabb bruttó, de kisebb a lemorzsolódás és nincs szezonalitási kockázat. Nyugdíj- vagy passzív jövedelem célnál gyakran ez a jobb választás.",
          "Fontos a devizakockázat is: az euróövezeten kívüli hozam (török líra, thai baht, indonéz rúpia) helyi pénznemben magas lehet, de a forintra/euróra váltásnál az árfolyamgyengülés elviheti a nyereséget."
        ]
      }
    ],
    faq: [
      {
        q: "Melyik országban a legmagasabb a bérleti hozam?",
        a: "Bruttó alapon Bali (6–9%), Dubaj (~7%) és az albán tengerpart (6–8%) vezet. Nettó alapon viszont a városi, egész éves piacok (Belgrád, Budapest, 4–6% bruttó) gyakran hasonlóan jól teljesítenek, mert nincs szezonalitási kockázatuk és alacsonyabb a kezelési költségük."
      },
      {
        q: "Mennyi a különbség a bruttó és a nettó hozam között?",
        a: "Turisztikai bérbeadásnál jellemzően 2–4 százalékpont. Egy 8%-os bruttó hozamú bali villa nettóban gyakran 4–5%. A különbséget a villamenedzsment (15–20%), a platformdíjak, a karbantartás, az adó és az üresedés adja."
      },
      {
        q: "Számít a bérbeadásnál a devizakockázat?",
        a: "Igen, jelentősen. Az euróövezeten kívüli országokban (Törökország, Thaiföld, Indonézia, Magyarország) a hozam a helyi pénznemben keletkezik, és a forintra vagy euróra váltásnál az árfolyam mozgása évi több százalékot is elvihet vagy hozzáadhat. Dubajban a dirham a dollárhoz van rögzítve, ami stabilabb, de USD-kitettséget jelent."
      }
    ]
  },
  {
    slug: "legolcsobb-tengerparti-ingatlan-europa",
    title: "A legolcsóbb tengerparti ingatlan Európában 2026-ban",
    description:
      "Hol vehető a legolcsóbban tengerre néző lakás Európában? Albánia, Montenegró és a Balkán árai összehasonlítva a horvát és görög piaccal.",
    answer:
      "A legolcsóbb európai tengerparti belépőt Albánia kínálja: az Albán Riviérán (Ksamil, Sarandë) az új építésű, tengerre néző lakás 1 200–2 200 €/m². Ezt követi Montenegró déli partja (Bar, Ulcinj) és a szerbiai nélküli Balkán. Horvátország és Görögország lényegesen drágább (jellemzően 2 500–5 000+ €/m² a jó parti lokációkban), cserébe EU-tagság és likvidebb piac jár.",
    category: "guide",
    emoji: "🌊",
    icon: "waves",
    updated: "2026-07-21",
    readMinutes: 5,
    keywords: [
      "legolcsóbb tengerparti ingatlan Európa",
      "olcsó tengerparti lakás eladó",
      "cheap seafront property Europe",
      "albán riviéra ingatlan ár",
      "hol olcsó a tengerparti ingatlan",
      "tengerre néző lakás ár négyzetméter",
      "montenegró tengerparti ingatlan ár",
      "olcsó tengerparti ingatlan Balkán",
      "ksamil sarandë ingatlan eladó",
      "tengerparti ingatlan 2026 belépő ár"
    ],
    sections: [
      {
        h: "Tengerparti belépőárak összehasonlítva",
        p: [
          "A négyzetméterár a tengerparttól való távolság, a kilátás és az építés éve szerint erősen szór. Az alábbi sávok az új építésű vagy jó állapotú, tengerhez közeli (nem feltétlenül első sori) lakásokra vonatkoznak, tájékoztató jelleggel."
        ],
        table: {
          head: ["Ország / régió", "Belépő €/m²", "Amit kap"],
          rows: [
            ["🇦🇱 Albán Riviéra (Ksamil, Sarandë)", "1 200–2 200 €", "Új építésű, tengerre néző, magas hozam"],
            ["🇲🇪 Montenegró dél (Bar, Ulcinj)", "1 500–2 500 €", "Euró, alacsony 3% belépő illeték"],
            ["🇲🇪 Montenegró prémium (Budva, Kotor)", "2 500–4 500 €", "Boka-öböl, erős kereslet"],
            ["🇭🇷 Horvátország (Dalmácia)", "2 500–5 000 €", "EU, schengeni, likvid piac"],
            ["🇬🇷 Görögország (szigetek)", "2 500–6 000 €", "EU, Golden Visa-lehetőség"]
          ]
        }
      },
      {
        h: "Az olcsó ár ára: mire figyeljen",
        p: [
          "Albániában a legalacsonyabb a belépő, de a piac a legfiatalabb: fordulnak elő rendezetlen tulajdoni hátterű vagy engedély nélkül épült ingatlanok. Független ügyvéddel végzett átvilágítás (tulajdoni lap az ASHK kataszterben, építési engedély) nélkül itt semmiképp ne fizessen foglalót.",
          "Montenegró jó középút: euróval fizet, az átírási illeték a legalacsonyabbak közt van, és a külföldi vevő gyakorlatilag a helyiekkel azonos jogokkal vásárol. Cserébe nem EU-tag (bár tagjelölt).",
          "Horvátország és Görögország drágább, de EU-tagság, schengeni szabad mozgás és lényegesen likvidebb újraértékesítés jár vele — ha fontos a könnyű kilépés, ez felülírhatja az árelőnyt."
        ]
      }
    ],
    faq: [
      {
        q: "Hol a legolcsóbb tengerparti ingatlan Európában?",
        a: "Albániában, az Albán Riviérán (Ksamil, Sarandë): az új építésű, tengerre néző lakások 1 200–2 200 €/m² sávban mozognak, ami a hasonló horvát vagy görög kínálat fele-harmada. A vevői mellékköltség is a legalacsonyabb, mert Albániában nincs értékarányos átírási adó a vevő oldalán."
      },
      {
        q: "Biztonságos-e Albániában olcsón tengerparti ingatlant venni?",
        a: "Jogilag igen — külföldi saját néven vehet lakást —, de a fő kockázat a tulajdoni háttér: engedély nélkül épült vagy rendezetlen jogcímű ingatlanok előfordulnak. Kötelező a független ügyvéddel végzett átvilágítás a foglaló előtt."
      },
      {
        q: "Megéri EU-tagállamban drágábban venni?",
        a: "Ha fontos a schengeni szabad mozgás, a jogi kiszámíthatóság és a gyors újraértékesítés, akkor igen — Horvátország és Görögország likvidebb és kiszámíthatóbb. Ha a cél a maximális hozam vagy a legalacsonyabb belépő, Albánia és Montenegró jobb."
      }
    ]
  },
  {
    slug: "kulfoldi-ingatlan-adozasa-magyar-tulajdonosnak",
    title: "Külföldi ingatlan adózása magyar tulajdonosként",
    description:
      "Hogyan adózik a külföldi ingatlan bérleti jövedelme és eladási nyeresége egy magyar adóügyi illetőségű tulajdonosnál? A kettős adóztatási egyezmények logikája érthetően.",
    answer:
      "Magyar adóügyi illetőségű magánszemélynél a külföldi ingatlan jövedelme kétszeresen is felmerülhet: az ingatlan fekvése szerinti országban ÉS Magyarországon. A kettős adóztatást a Magyarország által kötött egyezmények oldják fel — ingatlannál szinte mindig a FEKVÉS SZERINTI ország adóztat elsődlegesen, Magyarország pedig vagy mentesíti, vagy beszámítja a külföldön megfizetett adót. A konkrét szabály országonként eltér, ezért befektetés előtt adószakértővel érdemes tisztázni.",
    category: "guide",
    emoji: "🧾",
    icon: "wallet",
    updated: "2026-07-21",
    readMinutes: 7,
    keywords: [
      "külföldi ingatlan adózása",
      "külföldi bérleti jövedelem adó Magyarország",
      "kettős adóztatás ingatlan",
      "külföldi ingatlan eladás adó",
      "magyar illetőség külföldi ingatlan",
      "mentesítés beszámítás módszer adó",
      "világjövedelem elve külföldi ingatlan",
      "külföldi ingatlan öröklés adó",
      "kell-e adózni külföldi ingatlan után Magyarországon",
      "adóügyi illetőség golden visa"
    ],
    sections: [
      {
        h: "A kulcsfogalom: adóügyi illetőség",
        p: [
          "A magyar állampolgár jellemzően magyar adóügyi illetőségű marad akkor is, ha külföldön van ingatlana — hacsak nem költözik ki és nem helyezi át az életvitele központját. A magyar illetőségű magánszemély a VILÁGJÖVEDELME után adózik Magyarországon, tehát a külföldi ingatlan jövedelme is a magyar adóztatás körébe esik. A dupla adót az egyezmények zárják ki.",
          "Fontos: az, hogy Ön külföldön állampolgárságot vagy Golden Visát szerez, önmagában NEM szünteti meg a magyar adóügyi illetőséget. Az illetőség a tényleges tartózkodáshoz és az érdekközponthoz kötődik, nem az útlevélhez."
        ]
      },
      {
        h: "Bérleti jövedelem",
        p: [
          "A külföldi ingatlan bérleti jövedelmét szinte minden egyezmény szerint az ingatlan fekvése szerinti ország adóztatja elsődlegesen. Magyarország ezután kétféleképpen járhat el az egyezménytől függően: a MENTESÍTÉSES módszernél a külföldön adózott bérleti jövedelmet itthon nem adóztatja újra (de progresszió-fenntartással figyelembe veheti), a BESZÁMÍTÁSOS módszernél itthon is kiszámítja az adót, de levonja a külföldön megfizetettet.",
          "Van, ahol a fekvési ország nem vagy alig adóztatja a magánszemély bérleti jövedelmét (például az Egyesült Arab Emírségekben nincs személyi jövedelemadó) — ilyenkor különösen fontos megnézni, hogy a magyar oldal mentesít vagy beszámít, mert a kettő nagyon eltérő eredményt ad."
        ]
      },
      {
        h: "Eladási (árfolyam)nyereség",
        p: [
          "Az ingatlan eladásából származó nyereséget az egyezmények szintén jellemzően a fekvési országnak engedik adóztatni. Magyarországon az ingatlan értékesítéséből származó jövedelem 5 év után adómentes lehet (a szerzés évét követő ötödik évtől), de külföldi ingatlannál mindig az adott egyezményt és a fekvési ország szabályát kell együtt nézni.",
          "Devizás vétel és eladás esetén az árfolyam is számít: a magyar adóalapot forintban kell megállapítani, tehát a vételkori és az eladáskori árfolyam különbsége önmagában is befolyásolja a számított nyereséget."
        ]
      }
    ],
    faq: [
      {
        q: "Kell Magyarországon adót fizetni a külföldi ingatlanom után?",
        a: "Magyar adóügyi illetőségűként a világjövedelme után itthon is adóköteles, de a kettős adóztatási egyezmény kizárja, hogy ugyanazt kétszer megadóztassák. Ingatlannál jellemzően a fekvési ország adóztat elsődlegesen, Magyarország pedig vagy mentesíti a jövedelmet, vagy beszámítja a külföldön megfizetett adót. A konkrét módszer egyezményenként eltér."
      },
      {
        q: "Az állampolgárság vagy a Golden Visa megszünteti a magyar adókötelezettséget?",
        a: "Nem. Az adóügyi illetőség a tényleges tartózkodáshoz és az érdekközponthoz kötődik, nem az útlevélhez. Ha nem költözik ki és nem helyezi át az életvitele központját, magyar illetőségű marad, és a világjövedelme itthon is adóköteles."
      },
      {
        q: "Hol tájékozódjak a konkrét szabályról?",
        a: "A Magyarország és az adott ország közötti kettős adóztatási egyezményből, illetve nemzetközi adóügyekre szakosodott adótanácsadótól. Ez a cikk általános tájékoztatás, nem személyre szabott adótanács — hat számjegyű befektetés előtt mindenképp kérjen szakértői véleményt."
      }
    ]
  },
  {
    slug: "deviza-arfolyamkockazat-kulfoldi-ingatlan",
    title: "Deviza és árfolyamkockázat külföldi ingatlanvásárláskor",
    description:
      "Euró, dollár, líra vagy dirham? Milyen pénznemben adózik a kockázat a 12 piacon, és hogyan spórolhat a devizaváltáson a külföldi ingatlanvásárlásnál.",
    answer:
      "A 12 piac fele euróövezeti vagy euróban árazott (Montenegró, Horvátország, Görögország, Olaszország, Spanyolország, Albánia), így magyar vevőnek csak EUR/HUF kockázata van. A többinél külön deviza jön be: a dubaji dirham a dollárhoz van rögzítve (stabil, de USD-kitettség), a török líra, a thai baht és az indonéz rúpia viszont ingadozó. A banki devizaváltás marzsa önmagában 1–3% is lehet — ezen külön devizaszolgáltatóval sokat lehet spórolni.",
    category: "guide",
    emoji: "💱",
    icon: "euro",
    updated: "2026-07-21",
    readMinutes: 5,
    keywords: [
      "devizakockázat külföldi ingatlan",
      "árfolyamkockázat ingatlanvásárlás",
      "devizaváltás ingatlan külföld",
      "milyen pénznemben vegyek ingatlant",
      "EUR HUF ingatlanvásárlás",
      "spórolás devizaváltáson ingatlanvétel",
      "török líra kockázat golden visa",
      "dubaji dirham dollár árfolyam ingatlan",
      "banki devizaváltás marzs ingatlan",
      "devizaszolgáltató ingatlanvásárlás"
    ],
    sections: [
      {
        h: "Melyik piacon milyen a pénznem-kitettség?",
        p: [
          "A devizakockázat két ponton csap le: a vételár kifizetésekor (egyszeri váltás) és a bérleti jövedelem hazautalásakor (visszatérő váltás). Az euróövezeti piacokon magyar vevőnek csak egy pénznemréteg van (EUR/HUF), a nem euróövezetieknél kettő."
        ],
        table: {
          head: ["Piac", "Pénznem", "Kitettség"],
          rows: [
            ["🇲🇪🇭🇷🇬🇷🇮🇹🇪🇸🇦🇱", "EUR", "Csak EUR/HUF"],
            ["🇦🇪 Dubai", "AED (USD-hez rögzítve)", "Stabil, de USD/HUF"],
            ["🇹🇷 Törökország", "TRY (a küszöb USD-ben)", "Erős líra-ingadozás"],
            ["🇹🇭 Thaiföld", "THB", "Közepes ingadozás"],
            ["🇮🇩 Bali", "IDR", "Ingadozó, dollárosított díjak"],
            ["🇷🇸 Szerbia", "RSD (árazás gyakran EUR)", "Alacsony (dinár EUR-hoz kötött)"]
          ]
        }
      },
      {
        h: "Hogyan csökkentse a váltási veszteséget?",
        p: [
          "A kereskedelmi bankok devizaváltási marzsa (a vételi és eladási árfolyam különbsége) egy nagyobb ingatlanvételnél komoly összeg: 300 000 eurónál egy 2%-os marzs 6 000 euró. Dedikált devizaszolgáltatóval (pl. nemzetközi átutalási platformok) ez töredékére csökkenthető.",
          "A török program külön eset: a 400 000 USD-s állampolgársági küszöböt dollárban mérik, de a vételár lírában folyik — az árfolyam mozgása így a jogosultságot is befolyásolhatja, nem csak a költséget.",
          "A dubaji dirham a dollárhoz van rögzítve (1 USD = 3,6725 AED) 1997 óta, ami stabil — de egy magyar/euró-alapú vevő valójában USD-kockázatot vállal, mert az EUR/USD árfolyam mozgása a dirhamon keresztül hat a megtérülésre."
        ]
      }
    ],
    faq: [
      {
        q: "Melyik pénznem a legbiztonságosabb külföldi ingatlanvásárláshoz?",
        a: "Magyar/euró-alapú vevőnek az euróövezeti vagy euróban árazott piacok (Montenegró, Horvátország, Görögország, Olaszország, Spanyolország, Albánia) a legkiszámíthatóbbak, mert csak egy váltási réteg van. A dubaji dirham stabil (dollárhoz rögzített), de USD-kitettséget hordoz."
      },
      {
        q: "Mennyit lehet spórolni a devizaváltáson?",
        a: "A banki váltás marzsa 1–3%. Egy 300 000 eurós vételnél ez 3 000–9 000 euró. Dedikált nemzetközi devizaszolgáltatóval a marzs töredékére csökkenthető, tehát nagyobb összegnél mindig érdemes összehasonlítani."
      },
      {
        q: "Miért kockázatos a török líra a Golden Visánál?",
        a: "Az állampolgársági küszöböt (400 000 USD) dollárban mérik, de a vételár lírában folyik. Ha a líra gyengül a vétel és az értékbecslés között, az ingatlan dollárban mért értéke csökkenhet, és a küszöb alá eshet — ezért a devizás rögzítés és az időzítés itt kritikus."
      }
    ]
  },
  {
    slug: "ingatlanszotar-fogalmak",
    title: "Ingatlanszótár: 18 fogalom, amit külföldi vásárlás előtt ismerni kell",
    description:
      "Freehold, Golden Visa, tapu, escrow, off-plan, NIE — a külföldi ingatlanvásárlás legfontosabb szakkifejezései röviden, érthetően megmagyarázva.",
    answer:
      "A külföldi ingatlanvásárlás tele van szakkifejezéssel, amelyek félreértése pénzbe kerül. A legfontosabbak: a freehold a teljes (örök) tulajdon, a leasehold a hosszú bérleti jog; a Golden Visa befektetésért járó TARTÓZKODÁS, a CBI (citizenship by investment) viszont ÁLLAMPOLGÁRSÁG; az escrow a letéti számla, ami a foglalót védi; az off-plan a még épülő ingatlan; a due diligence a jogi átvilágítás. Ez a szótár 18 fogalmat magyaráz.",
    category: "guide",
    emoji: "📖",
    icon: "compass",
    updated: "2026-07-21",
    readMinutes: 6,
    keywords: [
      "ingatlan szakkifejezések",
      "freehold leasehold jelentése",
      "mi az a golden visa",
      "mi az az escrow off-plan",
      "külföldi ingatlanvásárlás fogalmak",
      "ingatlanszótár külföldi vásárlás",
      "tapu jelentése ingatlan",
      "due diligence jelentése ingatlan",
      "NIE codice fiscale AFM mi az",
      "off-plan vásárlás jelentése kockázat"
    ],
    sections: [
      {
        h: "Tulajdon és jog",
        p: [
          "Freehold — teljes, időben korlátlan tulajdonjog (a magyar „tulajdon” megfelelője).",
          "Leasehold — hosszú távú bérleti/használati jog (pl. 25–99 év); nem tulajdon, hanem határozott idejű jog. Balin és Thaiföldön a külföldiek jellemzően ezt szerzik.",
          "Usufruct (haszonélvezet) — az ingatlan használatának és hasznai szedésének joga, a tulajdon átruházása nélkül.",
          "Hak Pakai / Hak Sewa / Hak Guna Bangunan — az indonéz használati, bérleti és építési jogok, amelyeket külföldi a freehold helyett szerezhet.",
          "Kataszter / tulajdoni lap — a hivatalos ingatlan-nyilvántartás; a tulajdonjog itt bejegyezve válik teljessé. Törökországban ez a „tapu”."
        ]
      },
      {
        h: "Bevándorlás és befektetés",
        p: [
          "Golden Visa — befektetésért (jellemzően ingatlanvásárlásért) járó TARTÓZKODÁSI engedély; nem állampolgárság és nem útlevél.",
          "CBI (citizenship by investment) — befektetésért járó ÁLLAMPOLGÁRSÁG és útlevél; ingatlannal ma elsősorban Törökország kínálja.",
          "Due diligence — jogi átvilágítás: a tulajdoni lap, terhek, engedélyek és az alapterület ellenőrzése a vétel előtt."
        ]
      },
      {
        h: "Vásárlási folyamat",
        p: [
          "Escrow / letéti számla — semleges (ügyvédi vagy banki) számla, amely a foglalót őrzi, amíg a feltételek teljesülnek; véd a csalástól, főleg off-plan vételnél.",
          "Off-plan — még épülő, papíron megvásárolt ingatlan; olcsóbb lehet, de fejlesztői és készültségi kockázatot hordoz.",
          "Előszerződés — a végleges adásvételt előkészítő szerződés, jellemzően 10% foglalóval.",
          "Snagging — az átadás előtti hibalista (új építésűnél a fejlesztő által javítandó hiányosságok).",
          "Service charge — a társasházi közös költség (Dubajban, Thaiföldön jelentős tétel lehet)."
        ]
      },
      {
        h: "Adó és pénzügy",
        p: [
          "Átírási / vagyonszerzési adó — a tulajdon átruházásakor fizetendő adó (pl. török „tapu” illeték, spanyol ITP).",
          "ITP / AJD — a spanyol átruházási adó (ITP), illetve az okirati illeték (AJD).",
          "Prezzo-valore — az olasz mechanizmus, amelynél magánszemélyek között az adó alapja a (jellemzően alacsonyabb) kataszteri érték, nem a vételár.",
          "NIE / codice fiscale / AFM — a spanyol, olasz és görög külföldi adóazonosító, amely nélkül nem lehet szerződni.",
          "LTV (loan-to-value) — a hitel és az ingatlanérték aránya; külföldi vevőnél a bankok jellemzően alacsonyabb LTV-t adnak."
        ]
      }
    ],
    faq: [
      {
        q: "Mi a különbség a freehold és a leasehold között?",
        a: "A freehold teljes, időben korlátlan tulajdonjog. A leasehold határozott idejű (jellemzően 25–99 éves) bérleti vagy használati jog, ami a futamidő végén lejár vagy meghosszabbítandó. Balin és Thaiföldön a külföldiek gyakran csak leaseholdot szerezhetnek — ilyenkor a hosszabbítási feltétel a legfontosabb ellenőrzendő pont."
      },
      {
        q: "A Golden Visa ugyanaz, mint az állampolgárság?",
        a: "Nem. A Golden Visa befektetésért járó tartózkodási engedély — élhet és jöhet-mehet az adott országban, de az útlevele nem változik. Az állampolgárság (CBI) valódi útlevelet ad. A kettőt gyakran összekeverik; ingatlannal állampolgárságot ma elsősorban Törökország kínál."
      },
      {
        q: "Mi az az escrow, és miért fontos?",
        a: "Az escrow egy semleges letéti számla (ügyvédi vagy banki), amely a foglalót vagy a vételárat őrzi, amíg a szerződéses feltételek teljesülnek. Ez véd a csalástól és a fejlesztő nemteljesítésétől, ezért különösen off-plan (még épülő) vételnél kulcsfontosságú, hogy a pénz escrow-ba menjen, ne közvetlenül az eladóhoz."
      }
    ]
  }
];

/* ------------------------------------------------------------------ *
 * 2. ORSZÁG-KALAUZOK (generált, adatvezérelt)
 * ------------------------------------------------------------------ */

/** URL-barát ország-slugok — ezek a hazai keresési kifejezéseket célozzák. */
const COUNTRY_SLUG: Record<CountryCode, string> = {
  ME: "ingatlanbefektetes-montenegroban",
  HR: "ingatlanvasarlas-horvatorszagban",
  AL: "ingatlanbefektetes-albaniaban",
  RS: "ingatlanbefektetes-szerbiaban",
  TR: "ingatlanbefektetes-torokorszagban",
  ID: "ingatlanbefektetes-balin",
  HU: "ingatlanbefektetes-magyarorszagon",
  TH: "ingatlanbefektetes-thaifoldon",
  IT: "ingatlanvasarlas-olaszorszagban",
  GR: "ingatlanbefektetes-gorogorszagban",
  ES: "ingatlanvasarlas-spanyolorszagban",
  AE: "ingatlanbefektetes-dubajban"
};

function countryArticle(code: CountryCode): Article {
  const seo = COUNTRY_SEO[code];
  const info = COUNTRY_BY_CODE[code];
  const legal = FOREIGN_BUYER[code];
  const gv = info.goldenVisa;

  const costRows: string[][] = [
    ["Átírási / vagyonszerzési adó", transferTaxPct(code)],
    ["Közjegyző", `kb. ${Math.round(info.costs.notaryRate * 1000) / 10}% + ${info.costs.notaryFixed} €`],
    ["Ügyvéd", `kb. ${Math.round(info.costs.lawyerRate * 1000) / 10}%`],
    ["Ingatlanközvetítő", `jellemzően ${Math.round(info.costs.agencyRate * 1000) / 10}%`],
    ["Alapértelmezett pénznem", info.currency]
  ];
  if (gv) {
    costRows.push([
      gv.kind === "citizenship" ? "Állampolgársági küszöb" : "Golden Visa küszöb",
      fmtEur(gv.minEur)
    ]);
  }

  const sections: ArticleSection[] = [
    { h: `Miért ${seo.nameHu}?`, p: [seo.introHu] },
    {
      h: "A legfontosabb tények",
      p: seo.highlightsHu.map((h) => `• ${h}`)
    },
    {
      h: "Vásárlási költségek és küszöbök",
      p: [
        `Az alábbi tételekkel kell számolni ${seo.nameHu} esetében a vételáron felül. A kalkulátorunk minden hirdetésnél automatikusan kiszámolja a teljes bekerülési költséget.`
      ],
      table: { head: ["Tétel", "Mérték"], rows: costRows }
    },
    {
      h: "Külföldi vevőként mit kell tudni?",
      p: [legal.intro.hu, ...legal.points.map((pt) => `• ${pt.hu}`)]
    },
    {
      h: "Népszerű lokációk",
      p: [
        `A platformon jelenleg a következő célpontokra van aktív kínálatunk ${seo.inHu}: ${info.cities.join(", ")}. Mindegyikre külön szűrhet a keresőben, térképes nézettel és árösszehasonlítással.`
      ]
    }
  ];

  return {
    slug: COUNTRY_SLUG[code],
    title:
      gv?.kind === "citizenship"
        ? `${seo.nameHu}: ingatlanbefektetés és állampolgárság — teljes kalauz`
        : `Ingatlanbefektetés ${seo.inHu}: árak, adók, szabályok`,
    description: `${seo.nameHu} ingatlanpiaca külföldi vevőnek: mellékköltségek, jogi feltételek, ${
      gv ? "letelepedési vagy állampolgársági küszöb, " : ""
    }népszerű lokációk és aktuális kínálat.`,
    answer: seo.introHu.split(". ").slice(0, 2).join(". ") + ".",
    category: "country",
    emoji: info.flag,
    updated: UPDATED,
    readMinutes: 5,
    country: code,
    sections,
    faq: seo.faqHu,
    keywords: seo.keywords
  };
}

/* ------------------------------------------------------------------ *
 * 3. Nyilvános API
 * ------------------------------------------------------------------ */

export const ARTICLES: Article[] = [...PILLARS, ...COUNTRIES.map((c) => countryArticle(c.code))];

export const ARTICLE_BY_SLUG: Record<string, Article> = ARTICLES.reduce(
  (acc, a) => ((acc[a.slug] = a), acc),
  {} as Record<string, Article>
);

export const ARTICLE_SLUGS: string[] = ARTICLES.map((a) => a.slug);

/** Egy ország kalauzának slugja (a landingről ide linkelünk). */
export const countryArticleSlug = (code: CountryCode): string => COUNTRY_SLUG[code];

/** Kategória-címkék a hub szűrőjéhez. */
export const CATEGORY_LABEL: Record<Article["category"], string> = {
  citizenship: "Állampolgárság",
  "golden-visa": "Golden Visa",
  guide: "Kalauz",
  country: "Országkalauz"
};

/** Kapcsolódó cikkek: azonos kategória, majd feltöltés pillérekkel. */
export function relatedArticles(a: Article, n = 3): Article[] {
  const same = ARTICLES.filter((x) => x.slug !== a.slug && x.category === a.category);
  const rest = ARTICLES.filter((x) => x.slug !== a.slug && x.category !== a.category);
  return [...same, ...rest].slice(0, n);
}

/** Hivatkozás nélküli, gépi olvasásra szánt kivonat (llms.txt-hez). */
export const RESIDENCE_COUNTRY_CODES = RESIDENCE_COUNTRIES.map((c) => c.code);
export const CITIZENSHIP_COUNTRY_CODES = CITIZENSHIP_COUNTRIES.map((c) => c.code);
