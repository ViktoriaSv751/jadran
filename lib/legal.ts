import type { CountryCode } from "./types";

/**
 * Külföldi vevőknek szóló, ORSZÁGONKÉNTI tájékoztató a listing-oldalon.
 * TÁJÉKOZTATÓ JELLEGŰ — nem jogi tanácsadás. A szöveg a 4 tartalom-forrásnyelven
 * íródik (hu/me/en/ru), és a `loc()` oldja fel a felület nyelvére (mint a
 * hirdetés-tartalom). Így minden felület-nyelven megjelenik, fordítással.
 */

export interface L4 {
  hu: string;
  me: string;
  en: string;
  ru: string;
}

export interface ForeignBuyerLegal {
  intro: L4;
  points: L4[];
}

/**
 * Letelepedés / állampolgárság ingatlanvásárlás alapján, országonként.
 * `residenceNote`: mit ad a vásárlás a tartózkodás szempontjából.
 * `citizenshipEur`: ha van, ekkora (EUR-ban közelített) vételár fölött
 * állampolgársági/„golden visa" program jöhet szóba (`citizenshipNote`).
 * TÁJÉKOZTATÓ JELLEGŰ — a részletek változhatnak.
 */
export interface ResidencyInfo {
  residenceNote: L4;
  citizenshipEur?: number;
  citizenshipNote?: L4;
}

export const RESIDENCY: Record<CountryCode, ResidencyInfo> = {
  ME: {
    residenceNote: {
      hu: "Ingatlantulajdon támogatja az ideiglenes tartózkodási engedély kérelmét.",
      me: "Vlasništvo nad nekretninom podržava zahtjev za privremeni boravak.",
      en: "Property ownership supports a temporary residence permit application.",
      ru: "Владение недвижимостью помогает в получении ВНЖ."
    }
  },
  HR: {
    residenceNote: {
      hu: "EU-tagállam: az EU-s vevők szabadon letelepedhetnek; nem EU-s vevőknél az ingatlan segíti a tartózkodást.",
      me: "Članica EU: kupci iz EU se slobodno nastanjuju; van EU nekretnina pomaže boravak.",
      en: "EU member: EU buyers settle freely; for non-EU, property supports residence.",
      ru: "Член ЕС: покупатели из ЕС селятся свободно; для остальных недвижимость помогает ВНЖ."
    }
  },
  AL: {
    residenceNote: {
      hu: "Ingatlantulajdon alátámasztja a tartózkodási engedély iránti kérelmet.",
      me: "Vlasništvo nad nekretninom podržava zahtjev za dozvolu boravka.",
      en: "Property ownership supports a residence-permit application.",
      ru: "Владение недвижимостью поддерживает заявление на ВНЖ."
    }
  },
  RS: {
    residenceNote: {
      hu: "Ingatlantulajdon alapján kérhető ideiglenes tartózkodás.",
      me: "Na osnovu vlasništva može se tražiti privremeni boravak.",
      en: "Temporary residence can be applied for based on property ownership.",
      ru: "На основании собственности можно подать на временное пребывание."
    }
  },
  TR: {
    residenceNote: {
      hu: "Bármely ingatlan rövid távú tartózkodási engedélyre jogosíthat.",
      me: "Bilo koja nekretnina može dati pravo na kratkoročni boravak.",
      en: "Any property can qualify for a short-term residence permit.",
      ru: "Любая недвижимость может дать право на краткосрочный ВНЖ."
    },
    citizenshipEur: 370000, // ≈ 400 000 USD
    citizenshipNote: {
      hu: "Kb. 400 000 USD fölötti vásárlás török állampolgársági programra jogosíthat.",
      me: "Kupovina iznad ≈400.000 USD može dati pravo na program državljanstva.",
      en: "A purchase above ≈USD 400,000 can qualify for the citizenship program.",
      ru: "Покупка от ≈400 000 USD может дать право на программу гражданства."
    }
  },
  ID: {
    residenceNote: {
      hu: "Az ingatlan önmagában nem ad tartózkodást; KITAS/befektetői vízum külön igényelhető.",
      me: "Nekretnina sama ne daje boravak; KITAS/investitorska viza se traži posebno.",
      en: "Property alone doesn't grant residence; a KITAS/investor visa is applied for separately.",
      ru: "Недвижимость сама по себе не даёт ВНЖ; KITAS/инвесторская виза — отдельно."
    }
  }
};

export const FOREIGN_BUYER: Record<CountryCode, ForeignBuyerLegal> = {
  ME: {
    intro: {
      hu: "Montenegró nyitott a külföldi vásárlók előtt, egyszerű folyamattal.",
      me: "Crna Gora je otvorena za strane kupce, uz jednostavan postupak.",
      en: "Montenegro is open to foreign buyers with a straightforward process.",
      ru: "Черногория открыта для иностранных покупателей, процесс несложный."
    },
    points: [
      {
        hu: "Külföldiek szabadon vásárolhatnak lakást és épületet a saját nevükön.",
        me: "Stranci mogu slobodno kupiti stan i objekat na svoje ime.",
        en: "Foreigners can freely buy apartments and buildings in their own name.",
        ru: "Иностранцы могут свободно покупать квартиры и здания на своё имя."
      },
      {
        hu: "Mezőgazdasági és erdőterület vásárlása korlátozott — jellemzően cégen keresztül oldható meg.",
        me: "Kupovina poljoprivrednog i šumskog zemljišta je ograničena — obično preko firme.",
        en: "Buying agricultural and forest land is restricted — usually done via a company.",
        ru: "Покупка сельхоз- и лесных земель ограничена — обычно оформляется через компанию."
      },
      {
        hu: "Az ingatlanátírási adó jellemzően a vételár 3%-a.",
        me: "Porez na prenos nepokretnosti obično iznosi 3% cijene.",
        en: "Property transfer tax is typically 3% of the price.",
        ru: "Налог на переход собственности обычно составляет 3% от цены."
      },
      {
        hu: "Az adásvételt közjegyző hitelesíti, és a tulajdon a kataszterbe kerül bejegyzésre.",
        me: "Kupoprodaju ovjerava notar, a vlasništvo se upisuje u katastar.",
        en: "The sale is notarised and ownership is registered in the cadastre.",
        ru: "Сделка заверяется нотариусом, право собственности регистрируется в кадастре."
      }
    ]
  },
  HR: {
    intro: {
      hu: "Horvátország EU-tagállam; az EU-s és nem EU-s vevőkre eltérő szabályok vonatkoznak.",
      me: "Hrvatska je članica EU; pravila se razlikuju za kupce iz EU i van EU.",
      en: "Croatia is an EU member; rules differ for EU and non-EU buyers.",
      ru: "Хорватия — член ЕС; правила различаются для покупателей из ЕС и вне ЕС."
    },
    points: [
      {
        hu: "EU/EGT-állampolgárok a helyiekkel azonos feltételekkel vásárolhatnak.",
        me: "Državljani EU/EGP kupuju pod istim uslovima kao i domaći.",
        en: "EU/EEA citizens can buy on the same terms as locals.",
        ru: "Граждане ЕС/ЕЭП покупают на тех же условиях, что и местные."
      },
      {
        hu: "Nem EU-s vevőknek viszonossági elv vagy igazságügyi minisztériumi jóváhagyás kell.",
        me: "Kupcima van EU treba reciprocitet ili saglasnost Ministarstva pravosuđa.",
        en: "Non-EU buyers need reciprocity or Ministry of Justice consent.",
        ru: "Покупателям вне ЕС нужна взаимность или согласие Министерства юстиции."
      },
      {
        hu: "Gyakori megoldás egy horvát cég alapítása, amely bármely ingatlant megvehet.",
        me: "Česta opcija je osnivanje hrvatske firme koja može kupiti bilo koju nekretninu.",
        en: "A common route is a Croatian company, which can buy any property.",
        ru: "Частый путь — хорватская компания, которая может купить любую недвижимость."
      },
      {
        hu: "Az ingatlanszerzési adó (RETT) jellemzően a vételár 3%-a.",
        me: "Porez na promet nekretnina (RETT) obično iznosi 3% cijene.",
        en: "Real-estate transfer tax (RETT) is typically 3% of the price.",
        ru: "Налог на передачу недвижимости (RETT) обычно составляет 3% от цены."
      }
    ]
  },
  AL: {
    intro: {
      hu: "Albánia egyre nyitottabb a külföldi vásárlók előtt, gyorsan fejlődő piaccal.",
      me: "Albanija je sve otvorenija za strane kupce, uz tržište koje brzo raste.",
      en: "Albania is increasingly open to foreign buyers with a fast-growing market.",
      ru: "Албания всё более открыта для иностранных покупателей, рынок быстро растёт."
    },
    points: [
      {
        hu: "Külföldiek vásárolhatnak lakást és épületet; a telek (föld) vásárlása korlátozott.",
        me: "Stranci mogu kupiti stanove i objekte; kupovina zemljišta je ograničena.",
        en: "Foreigners can buy apartments and buildings; buying land is restricted.",
        ru: "Иностранцы могут покупать квартиры и здания; покупка земли ограничена."
      },
      {
        hu: "Földhöz jellemzően hosszú távú bérlettel vagy helyi cégen keresztül lehet jutni.",
        me: "Do zemljišta se obično dolazi dugoročnim zakupom ili preko lokalne firme.",
        en: "Land is usually accessed via a long-term lease or a local company.",
        ru: "Землю обычно получают через долгосрочную аренду или местную компанию."
      },
      {
        hu: "A tulajdon a kataszterbe (ASHK) kerül bejegyzésre; érdemes ügyvédet bevonni.",
        me: "Vlasništvo se upisuje u katastar (ASHK); preporučuje se advokat.",
        en: "Ownership is registered in the cadastre (ASHK); using a lawyer is advised.",
        ru: "Право собственности регистрируется в кадастре (ASHK); желателен юрист."
      },
      {
        hu: "A vételár rendszerint euróban értendő; a mellékköltségek alacsonyak.",
        me: "Cijena je najčešće u eurima; sporedni troškovi su niski.",
        en: "Prices are usually quoted in euros; transaction costs are low.",
        ru: "Цены обычно указывают в евро; сопутствующие расходы невелики."
      }
    ]
  },
  RS: {
    intro: {
      hu: "Szerbiában külföldiek viszonossági elv alapján szerezhetnek ingatlant.",
      me: "U Srbiji stranci mogu steći nekretninu po principu reciprociteta.",
      en: "In Serbia, foreigners can acquire property based on reciprocity.",
      ru: "В Сербии иностранцы могут приобретать недвижимость по принципу взаимности."
    },
    points: [
      {
        hu: "Lakás és épület vásárolható, ha az adott ország viszonosságot biztosít Szerbiával.",
        me: "Stan i objekat se mogu kupiti ako postoji reciprocitet sa Srbijom.",
        en: "Apartments and buildings can be bought where reciprocity with Serbia exists.",
        ru: "Квартиры и здания можно покупать при наличии взаимности с Сербией."
      },
      {
        hu: "Mezőgazdasági föld vásárlása korlátozott; gyakori a cégen keresztüli megoldás.",
        me: "Kupovina poljoprivrednog zemljišta je ograničena; često se ide preko firme.",
        en: "Buying agricultural land is restricted; a company route is common.",
        ru: "Покупка сельхозземли ограничена; часто используют компанию."
      },
      {
        hu: "Az átruházási adó jellemzően 2,5%, illetve új építésűnél ÁFA lehet érvényes.",
        me: "Porez na prenos je obično 2,5%, a kod novogradnje može važiti PDV.",
        en: "Transfer tax is typically 2.5%, or VAT may apply on new builds.",
        ru: "Налог на передачу обычно 2,5%, для новостроек может применяться НДС."
      },
      {
        hu: "A tulajdont az ingatlan-nyilvántartásba (katastar) jegyzik be.",
        me: "Vlasništvo se upisuje u katastar nepokretnosti.",
        en: "Ownership is registered in the real-estate cadastre.",
        ru: "Право собственности регистрируется в кадастре недвижимости."
      }
    ]
  },
  TR: {
    intro: {
      hu: "Törökország nyitott a külföldi vevők előtt, és állampolgársági programot is kínál.",
      me: "Turska je otvorena za strane kupce i nudi program državljanstva.",
      en: "Turkey is open to foreign buyers and offers a citizenship program.",
      ru: "Турция открыта для иностранных покупателей и предлагает программу гражданства."
    },
    points: [
      {
        hu: "Külföldiek a legtöbb ingatlant szabadon megvehetik (katonai övezetek kivételével).",
        me: "Stranci mogu slobodno kupiti većinu nekretnina (osim vojnih zona).",
        en: "Foreigners can freely buy most property (except military zones).",
        ru: "Иностранцы могут свободно покупать большинство объектов (кроме военных зон)."
      },
      {
        hu: "Legalább 400 000 USD értékű vásárlás török állampolgárságra jogosíthat.",
        me: "Kupovina od najmanje 400.000 USD može dati pravo na tursko državljanstvo.",
        en: "A purchase of at least USD 400,000 can qualify for Turkish citizenship.",
        ru: "Покупка от 400 000 USD может дать право на турецкое гражданство."
      },
      {
        hu: "A tulajdonjogot a „tapu” (tulajdoni lap) igazolja, a földhivatalnál bejegyezve.",
        me: "Vlasništvo potvrđuje „tapu” (list nepokretnosti), upisan u katastar.",
        en: "Ownership is proven by the “tapu” (title deed), registered at the land registry.",
        ru: "Право собственности подтверждает «тапу» (свидетельство), внесённое в реестр."
      },
      {
        hu: "Kell egy adószám és török bankszámla; a nemzetközi árak gyakran EUR/USD-ben.",
        me: "Potreban je poreski broj i turski račun; cijene su često u EUR/USD.",
        en: "A tax number and Turkish bank account are needed; prices are often in EUR/USD.",
        ru: "Нужны налоговый номер и турецкий счёт; цены часто в EUR/USD."
      }
    ]
  },
  ID: {
    intro: {
      hu: "Balin (Indonézia) a külföldi tulajdonlás sajátos — jellemzően bérleti (leasehold) konstrukció.",
      me: "Na Baliju (Indonezija) strano vlasništvo je specifično — obično leasehold.",
      en: "In Bali (Indonesia) foreign ownership is specific — usually a leasehold structure.",
      ru: "На Бали (Индонезия) иностранное владение специфично — обычно лизхолд."
    },
    points: [
      {
        hu: "Külföldi magánszemély NEM szerezhet szabad tulajdont (Hak Milik).",
        me: "Strano fizičko lice NE može steći puno vlasništvo (Hak Milik).",
        en: "A foreign individual CANNOT hold freehold (Hak Milik).",
        ru: "Иностранное физлицо НЕ может владеть фрихолдом (Hak Milik)."
      },
      {
        hu: "Bevett a leasehold (Hak Sewa), jellemzően 25–30 évre, meghosszabbítható.",
        me: "Uobičajen je leasehold (Hak Sewa), obično 25–30 godina, uz produženje.",
        en: "Leasehold (Hak Sewa) is common, usually 25–30 years, renewable.",
        ru: "Распространён лизхолд (Hak Sewa), обычно 25–30 лет, с продлением."
      },
      {
        hu: "Alternatíva a „Hak Pakai” használati jog vagy egy PT PMA (külföldi tulajdonú cég).",
        me: "Alternativa je pravo korišćenja „Hak Pakai” ili PT PMA (strana firma).",
        en: "Alternatives are the “Hak Pakai” right to use, or a PT PMA (foreign-owned company).",
        ru: "Альтернативы — право пользования «Hak Pakai» или PT PMA (иностранная компания)."
      },
      {
        hu: "Elengedhetetlen a jogi átvilágítás (due diligence) és a notaris (PPAT) bevonása.",
        me: "Neophodni su pravna provjera (due diligence) i notar (PPAT).",
        en: "Legal due diligence and a notary (PPAT) are essential.",
        ru: "Обязательны юридическая проверка (due diligence) и нотариус (PPAT)."
      }
    ]
  }
};
