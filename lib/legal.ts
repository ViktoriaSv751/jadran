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
 * állampolgársági/„golden visa” program jöhet szóba (`citizenshipNote`).
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
  },
  HU: {
    residenceNote: {
      hu: "EU-tagállam: az EU-s vevők szabadon letelepednek; nem EU-soknál a Vendégbefektetői program (ingatlanalap-befektetéssel) adhat tartózkodást.",
      me: "Članica EU: kupci iz EU se slobodno nastanjuju; za ostale postoji program za goste-investitore.",
      en: "EU member: EU buyers settle freely; for others the Guest Investor Programme (via a real-estate fund) can grant residence.",
      ru: "Член ЕС: покупатели из ЕС селятся свободно; для остальных — программа гостя-инвестора."
    }
  },
  TH: {
    residenceNote: {
      hu: "Az ingatlan önmagában nem ad letelepedést; a Thailand Elite / LTR vízum a szokásos hosszú távú út.",
      me: "Nekretnina sama ne daje boravak; Thailand Elite / LTR viza je uobičajen dugoročni put.",
      en: "Property alone doesn't grant residence; the Thailand Elite / LTR visa is the usual long-stay route.",
      ru: "Недвижимость сама по себе не даёт ВНЖ; обычный путь — виза Thailand Elite / LTR."
    }
  },
  IT: {
    residenceNote: {
      hu: "EU-tagállam: az EU-s vevők szabadon letelepednek; nem EU-soknak a passzív jövedelemre épülő „elective residence” vízum lehet út.",
      me: "Članica EU: kupci iz EU se slobodno nastanjuju; za ostale postoji „elective residence” viza.",
      en: "EU member: EU buyers settle freely; for others the passive-income “elective residence” visa is an option.",
      ru: "Член ЕС: покупатели из ЕС селятся свободно; для остальных — виза «elective residence»."
    }
  },
  GR: {
    residenceNote: {
      hu: "Görög Golden Visa (5100/2024): 800 000 € Attikában, Thesszalonikiben és a nagy szigeteken, 400 000 € máshol, 250 000 € csak átminősítésnél vagy műemlék-felújításnál. Az ingatlant TILOS rövid távra kiadni.",
      me: "Grčka Golden Visa: 800.000 € u Atici i na velikim ostrvima, 400.000 € drugdje. Kratkoročni najam je zabranjen.",
      en: "Greek Golden Visa (Law 5100/2024): €800,000 in Attica, Thessaloniki and larger islands, €400,000 elsewhere, €250,000 only for conversions or listed-building restoration. Short-term letting is banned.",
      ru: "Golden Visa Греции: €800 000 в Аттике и на крупных островах, €400 000 в остальных регионах. Краткосрочная аренда запрещена."
    },
    citizenshipEur: 400000,
    citizenshipNote: {
      hu: "400 000 € fölötti ingatlan a görög Golden Visára jogosíthat — Attikában, Thesszalonikiben és a nagyobb szigeteken viszont 800 000 € a küszöb, és az ingatlant nem lehet rövid távra kiadni.",
      me: "Nekretnina iznad 400.000 € može dati pravo na grčku Golden Visa; u Atici 800.000 €.",
      en: "Property above €400,000 can qualify for the Greek Golden Visa — but in Attica, Thessaloniki and larger islands the threshold is €800,000, and short-term letting is not allowed.",
      ru: "Недвижимость от €400 000 может дать греческую Golden Visa; в Аттике — от €800 000."
    }
  },
  ES: {
    // Az ingatlanalapú spanyol Golden Visát 2025 áprilisában megszüntették, ezért
    // itt nincs `citizenshipEur` — az ingatlanvásárlás nem ad tartózkodási jogot.
    residenceNote: {
      hu: "Spanyolország: az ingatlanalapú Golden Visát 2025 áprilisában megszüntették — ingatlanvásárlással ma nem szerezhető befektetői tartózkodás.",
      me: "Španija: investitorska Golden Visa na osnovu nekretnine ukinuta je u aprilu 2025.",
      en: "Spain: the real-estate Golden Visa was abolished in April 2025 — buying property no longer grants investor residence.",
      ru: "Испания: инвесторская Golden Visa за недвижимость отменена в апреле 2025 года."
    }
  },
  AE: {
    residenceNote: {
      hu: "Egyesült Arab Emírségek: 2 000 000 AED (~505 000 €) értékű ingatlan 10 éves, megújítható Golden Visára (tartózkodás) jogosít. Állampolgárságot ingatlannal NEM lehet szerezni.",
      me: "UAE: nekretnina od 2.000.000 AED (~505.000 €) daje 10-godišnju Golden Visa (boravak); državljanstvo se ne može steći.",
      en: "UAE: property worth AED 2,000,000 (~€505,000) qualifies for a renewable 10-year Golden Visa (residence). Citizenship cannot be obtained through property.",
      ru: "ОАЭ: недвижимость на 2 000 000 AED (~505 000 €) даёт возобновляемую 10-летнюю Golden Visa (ВНЖ); гражданство через недвижимость получить нельзя."
    },
    citizenshipEur: 505000,
    citizenshipNote: {
      hu: "2 000 000 AED (~505 000 €) fölötti ingatlan 10 éves Golden Visára jogosít — ez tartózkodási engedély, NEM állampolgárság.",
      me: "Nekretnina iznad 2.000.000 AED (~505.000 €) daje 10-godišnju Golden Visa — to je boravak, ne državljanstvo.",
      en: "Property above AED 2,000,000 (~€505,000) qualifies for a 10-year Golden Visa — this is residence, NOT citizenship.",
      ru: "Недвижимость от 2 000 000 AED (~505 000 €) даёт 10-летнюю Golden Visa — это ВНЖ, а НЕ гражданство."
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
  },
  HU: {
    intro: {
      hu: "Magyarország EU-tagállam; az EU-s és nem EU-s vevőkre eltérő szabályok vonatkoznak.",
      me: "Mađarska je članica EU; pravila se razlikuju za kupce iz EU i van EU.",
      en: "Hungary is an EU member; rules differ for EU and non-EU buyers.",
      ru: "Венгрия — член ЕС; правила различаются для покупателей из ЕС и вне ЕС."
    },
    points: [
      {
        hu: "EU-állampolgárok a helyiekkel azonos feltételekkel vásárolhatnak lakóingatlant.",
        me: "Državljani EU kupuju stambene nekretnine pod istim uslovima kao domaći.",
        en: "EU citizens can buy residential property on the same terms as locals.",
        ru: "Граждане ЕС покупают жильё на тех же условиях, что и местные."
      },
      {
        hu: "Nem EU-s vevőknek a kormányhivatal engedélye kell (lakóingatlanra jellemzően megadják).",
        me: "Kupcima van EU treba dozvola nadležnog organa (za stanove se obično izdaje).",
        en: "Non-EU buyers need government-office approval (usually granted for homes).",
        ru: "Покупателям вне ЕС нужно разрешение госоргана (для жилья обычно выдают)."
      },
      {
        hu: "Termőföld vásárlása külföldieknek erősen korlátozott.",
        me: "Kupovina poljoprivrednog zemljišta za strance je jako ograničena.",
        en: "Buying agricultural land is heavily restricted for foreigners.",
        ru: "Покупка сельхозземли для иностранцев сильно ограничена."
      },
      {
        hu: "A visszterhes vagyonátruházási illeték jellemzően 4%.",
        me: "Porez na prenos imovine je obično 4%.",
        en: "The property transfer duty is typically 4%.",
        ru: "Налог на передачу имущества обычно 4%."
      }
    ]
  },
  TH: {
    intro: {
      hu: "Thaiföldön a külföldi tulajdon sajátos — társasházi lakás igen, telek/föld nem.",
      me: "Na Tajlandu je strano vlasništvo specifično — stan da, zemljište ne.",
      en: "In Thailand foreign ownership is specific — condos yes, land no.",
      ru: "В Таиланде иностранное владение специфично — кондо да, земля нет."
    },
    points: [
      {
        hu: "Külföldi NEM birtokolhat telket/földet; társasházi lakást (condo) igen, szabad tulajdonként.",
        me: "Stranac NE može posjedovati zemljište; stan (condo) može, u punom vlasništvu.",
        en: "A foreigner CANNOT own land; a condominium unit can be owned freehold.",
        ru: "Иностранец НЕ может владеть землёй; квартиру в кондо — можно в собственность."
      },
      {
        hu: "Egy társasház lakásainak legfeljebb 49%-a lehet külföldi tulajdonban.",
        me: "Najviše 49% stanova u zgradi može biti u stranom vlasništvu.",
        en: "At most 49% of a building's units can be foreign-owned.",
        ru: "Не более 49% квартир в доме может принадлежать иностранцам."
      },
      {
        hu: "Villához/telekhez jellemzően hosszú távú bérlet (30 év, hosszabbítható) vagy thai cég.",
        me: "Za vilu/zemljište obično dugoročni zakup (30 g.) ili tajlandska firma.",
        en: "Villas/land are usually via a long lease (30 yrs, renewable) or a Thai company.",
        ru: "Виллы/земля — обычно через долгую аренду (30 лет) или тайскую компанию."
      },
      {
        hu: "Az átírási díj kb. 2%; a pénz külföldi eredetét igazolni kell (FET).",
        me: "Naknada za prenos je oko 2%; strano porijeklo novca se dokazuje (FET).",
        en: "The transfer fee is about 2%; foreign funds must be evidenced (FET form).",
        ru: "Сбор за передачу около 2%; иностранное происхождение средств подтверждается (FET)."
      }
    ]
  },
  IT: {
    intro: {
      hu: "Olaszország EU-tagállam; az EU-s vevők szabadon, a nem EU-sok viszonossági elv alapján vásárolhatnak.",
      me: "Italija je članica EU; kupci iz EU slobodno, ostali po reciprocitetu.",
      en: "Italy is an EU member; EU buyers freely, non-EU under reciprocity.",
      ru: "Италия — член ЕС; покупатели из ЕС свободно, остальные по взаимности."
    },
    points: [
      {
        hu: "EU-állampolgárok a helyiekkel azonos feltételekkel vásárolhatnak.",
        me: "Državljani EU kupuju pod istim uslovima kao domaći.",
        en: "EU citizens can buy on the same terms as locals.",
        ru: "Граждане ЕС покупают на тех же условиях, что и местные."
      },
      {
        hu: "Nem EU-s vevőknél a viszonosság dönt (a legtöbb országgal fennáll).",
        me: "Za kupce van EU odlučuje reciprocitet (sa većinom zemalja postoji).",
        en: "For non-EU buyers reciprocity applies (in place with most countries).",
        ru: "Для покупателей вне ЕС действует взаимность (есть с большинством стран)."
      },
      {
        hu: "A vételt közjegyző (notaio) hitelesíti; a tulajdon a nyilvántartásba kerül.",
        me: "Kupovinu ovjerava notar (notaio); vlasništvo se upisuje u registar.",
        en: "The purchase is notarised (notaio); ownership is entered in the registry.",
        ru: "Сделку заверяет нотариус (notaio); право вносится в реестр."
      },
      {
        hu: "A regisztrációs/átírási adó első lakásnál ~2%, egyébként ~9%.",
        me: "Porez na registraciju je ~2% za prvi dom, inače ~9%.",
        en: "Registration/transfer tax is ~2% for a first home, otherwise ~9%.",
        ru: "Регистрационный налог ~2% для первого жилья, иначе ~9%."
      }
    ]
  },
  GR: {
    intro: {
      hu: "Görögország EU-tagállam, erős Golden Visa programmal a külföldi vevőknek.",
      me: "Grčka je članica EU sa snažnim Golden Visa programom.",
      en: "Greece is an EU member with a strong Golden Visa program for foreign buyers.",
      ru: "Греция — член ЕС с сильной программой Golden Visa."
    },
    points: [
      {
        hu: "Külföldiek (EU-n kívüliek is) szabadon vásárolhatnak ingatlant a saját nevükön.",
        me: "Stranci (i van EU) mogu slobodno kupiti nekretninu na svoje ime.",
        en: "Foreigners (including non-EU) can freely buy property in their own name.",
        ru: "Иностранцы (в т.ч. вне ЕС) могут свободно покупать недвижимость на своё имя."
      },
      {
        hu: "Golden Visa: 250 000–800 000 € ingatlan (régiótól függően) 5 éves tartózkodást ad.",
        me: "Golden Visa: 250.000–800.000 € daje 5-godišnji boravak.",
        en: "Golden Visa: €250,000–800,000 property grants 5-year residence.",
        ru: "Golden Visa: недвижимость €250 000–800 000 даёт ВНЖ на 5 лет."
      },
      {
        hu: "Kell görög adószám (AFM) és bankszámla; a vételt közjegyző hitelesíti.",
        me: "Potreban je grčki poreski broj (AFM) i račun; ovjera kod notara.",
        en: "A Greek tax number (AFM) and bank account are needed; the sale is notarised.",
        ru: "Нужны греческий налоговый номер (AFM) и счёт; сделка заверяется нотариусом."
      },
      {
        hu: "Az ingatlanátruházási adó jellemzően ~3,1% (új építésűnél ÁFA is lehet).",
        me: "Porez na prenos je obično ~3,1%.",
        en: "Property transfer tax is typically ~3.1% (VAT may apply on new builds).",
        ru: "Налог на передачу обычно ~3,1% (для новостроек возможен НДС)."
      }
    ]
  },
  ES: {
    intro: {
      hu: "Spanyolország EU-tagállam; a külföldi vevők előtt teljesen nyitott piac (befektetői tartózkodás 2025 áprilisa óta nincs).",
      me: "Španija je članica EU; tržište je otvoreno za strane kupce (investitorski boravak ukinut 2025).",
      en: "Spain is an EU member; fully open to foreign buyers (investor residence discontinued in 2025).",
      ru: "Испания — член ЕС; рынок полностью открыт (инвесторский ВНЖ отменён в 2025)."
    },
    points: [
      {
        hu: "Külföldiek szabadon vásárolhatnak; szükséges egy NIE (külföldi azonosító szám).",
        me: "Stranci mogu slobodno kupiti; potreban je NIE broj.",
        en: "Foreigners can buy freely; an NIE (foreigner ID number) is required.",
        ru: "Иностранцы могут свободно покупать; нужен номер NIE."
      },
      {
        hu: "Az ingatlanalapú Golden Visát 2025 áprilisában megszüntették — ingatlanvásárlás ma nem ad befektetői tartózkodást.",
        me: "Golden Visa na osnovu nekretnine ukinuta je u aprilu 2025.",
        en: "The real-estate Golden Visa was abolished in April 2025 — buying property no longer grants investor residence.",
        ru: "Инвесторская Golden Visa за недвижимость отменена в апреле 2025 года."
      },
      {
        hu: "A vételt közjegyző (notario) hitelesíti, és a tulajdon-nyilvántartásba kerül.",
        me: "Kupovinu ovjerava notar (notario); upis u registar vlasništva.",
        en: "The purchase is notarised (notario) and entered in the property registry.",
        ru: "Сделку заверяет нотариус (notario); запись в реестр собственности."
      },
      {
        hu: "Az átruházási adó (ITP) régiónként ~6–11%, új építésűnél 10% ÁFA.",
        me: "Porez na prenos (ITP) je ~6–11% po regiji; kod novogradnje 10% PDV.",
        en: "Transfer tax (ITP) is ~6–11% by region; new builds carry 10% VAT.",
        ru: "Налог на передачу (ITP) ~6–11% по региону; для новостроек 10% НДС."
      }
    ]
  },
  AE: {
    intro: {
      hu: "Dubaj a kijelölt „freehold” övezetekben teljesen nyitott a külföldi vevők előtt, és a vétel után egyenesadó gyakorlatilag nincs.",
      me: "Dubai je u „freehold” zonama potpuno otvoren za strane kupce; nakon kupovine praktično nema poreza.",
      en: "In its designated freehold areas Dubai is fully open to foreign buyers, with virtually no ownership taxes afterwards.",
      ru: "В обозначенных «freehold» зонах Дубай полностью открыт для иностранцев; после покупки прямых налогов практически нет."
    },
    points: [
      {
        hu: "Külföldi bármely nemzetiséggel, saját néven, tartózkodási engedély nélkül vehet FREEHOLD ingatlant a kijelölt övezetekben (Dubai Marina, Downtown, Palm Jumeirah stb.).",
        me: "Stranac bilo koje nacionalnosti može kupiti freehold u određenim zonama, bez boravka.",
        en: "A foreigner of any nationality can buy FREEHOLD in designated areas (Dubai Marina, Downtown, Palm Jumeirah, etc.) in their own name, without residency.",
        ru: "Иностранец любой национальности может купить freehold в обозначенных зонах на своё имя, без ВНЖ."
      },
      {
        hu: "A kijelölt övezeteken KÍVÜL a tulajdon UAE/GCC állampolgároknak van fenntartva — vásárlás előtt a konkrét ingatlan övezetét a DLD-nél kell ellenőrizni.",
        me: "Van određenih zona vlasništvo je rezervisano za državljane UAE/GCC — provjeriti kod DLD.",
        en: "OUTSIDE the designated areas ownership is reserved to UAE/GCC nationals — verify the specific property's zone with the DLD before buying.",
        ru: "ВНЕ обозначенных зон собственность зарезервирована за гражданами ОАЭ/GCC — проверяйте зону объекта в DLD."
      },
      {
        hu: "Az ingatlanátírási illeték (DLD) 4%: hivatalosan 2% vevő + 2% eladó, a gyakorlatban a vevő fizeti a teljes 4%-ot. Ehhez jön kb. 4 200 AED trustee-díj és a 250 AED tulajdonilap-díj.",
        me: "DLD taksa je 4% (formalno 2%+2%, u praksi plaća kupac); + ~4.200 AED trustee i 250 AED za list.",
        en: "The DLD transfer fee is 4% (officially 2% buyer + 2% seller, in practice the buyer pays the full 4%), plus a ~AED 4,200 trustee fee and AED 250 title-deed fee.",
        ru: "Сбор DLD — 4% (формально 2%+2%, на практике платит покупатель) плюс ~4200 AED trustee и 250 AED за свидетельство."
      },
      {
        hu: "Nincs éves ingatlanadó, személyi jövedelemadó, tőkenyereség-adó és bérletiadó a magánszemély tulajdonosnak; a lakóingatlan bérbeadása ÁFA-mentes.",
        me: "Nema godišnjeg poreza na imovinu, poreza na dohodak ni na kapitalnu dobit za fizičko lice.",
        en: "There is no annual property tax, personal income tax, capital-gains tax or rental-income tax for an individual owner; residential leasing is VAT-exempt.",
        ru: "Нет ежегодного налога на недвижимость, НДФЛ, налога на прирост капитала и на арендный доход для физлица; аренда жилья освобождена от НДС."
      },
      {
        hu: "2 000 000 AED (~505 000 €) értékű ingatlan 10 éves, megújítható Golden Visára jogosít, a családtagokkal együtt — ez TARTÓZKODÁS, nem állampolgárság.",
        me: "Nekretnina od 2.000.000 AED (~505.000 €) daje 10-godišnju Golden Visa sa porodicom — boravak, ne državljanstvo.",
        en: "Property worth AED 2,000,000 (~€505,000) qualifies for a renewable 10-year Golden Visa including family members — this is RESIDENCE, not citizenship.",
        ru: "Недвижимость на 2 000 000 AED (~505 000 €) даёт возобновляемую 10-летнюю Golden Visa с семьёй — это ВНЖ, не гражданство."
      }
    ]
  }
};
