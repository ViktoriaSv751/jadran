"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { BOOST_PLANS, type SubPlanId } from "@/lib/pricing";
import * as db from "@/lib/db";
import { toast, openAuth } from "@/lib/ui";
import PageHeading from "@/components/ui/PageHeading";
import Icon from "@/components/ui/Icon";

// Teljes 12 nyelvű felület-fordítást feloldó helper (angol fallbackkel).
type PL = Partial<Record<Lang, string>>;
const L = (o: PL, lang: Lang) => (o as Record<string, string>)[lang] ?? o.en ?? o.hu ?? "";

interface Tier {
  id: "start" | "pro" | "premium";
  name: string;
  tagline: PL;
  monthly: number; // EUR / hó
  yearly: number; // EUR / év (≈ 10 hónap ára)
  popular?: boolean;
  features: PL[];
}

const TIERS: Tier[] = [
  {
    id: "start",
    name: "Start",
    tagline: { hu: "Kis irodáknak, akik most kezdenek.", me: "Za male agencije na početku.", en: "For small agencies getting started.", ru: "Для небольших агентств.", sr: "За мале агенције на почетку.", bs: "Za male agencije na početku.", hr: "Za male agencije na početku.", uk: "Для невеликих агентств, що починають роботу.", sq: "Për agjenci të vogla që sapo nisin.", el: "Για μικρά μεσιτικά γραφεία που ξεκινούν.", tr: "Yeni başlayan küçük acenteler için.", es: "Para pequeñas agencias que empiezan." },
    monthly: 29,
    yearly: 290,
    features: [
      { hu: "10 aktív hirdetés", me: "10 aktivnih oglasa", en: "10 active listings", ru: "10 активных объявлений", sr: "10 активних огласа", bs: "10 aktivnih oglasa", hr: "10 aktivnih oglasa", uk: "10 активних оголошень", sq: "10 shpallje aktive", el: "10 ενεργές αγγελίες", tr: "10 aktif ilan", es: "10 anuncios activos" },
      { hu: "1 kiemelés / hó", me: "1 izdvajanje / mj.", en: "1 featured boost / mo", ru: "1 продвижение / мес", sr: "1 издвајање / мес.", bs: "1 izdvajanje / mj.", hr: "1 izdvajanje / mj.", uk: "1 просування / міс.", sq: "1 promovim i veçuar / muaj", el: "1 προβολή προώθησης / μήνα", tr: "Ayda 1 öne çıkarma", es: "1 impulso destacado / mes" },
      { hu: "Alap statisztikák", me: "Osnovna statistika", en: "Basic stats", ru: "Базовая статистика", sr: "Основна статистика", bs: "Osnovna statistika", hr: "Osnovna statistika", uk: "Базова статистика", sq: "Statistika bazë", el: "Βασικά στατιστικά", tr: "Temel istatistikler", es: "Estadísticas básicas" },
      { hu: "1 felhasználó", me: "1 korisnik", en: "1 team member", ru: "1 пользователь", sr: "1 корисник", bs: "1 korisnik", hr: "1 korisnik", uk: "1 учасник команди", sq: "1 anëtar ekipi", el: "1 μέλος ομάδας", tr: "1 ekip üyesi", es: "1 miembro del equipo" },
      { hu: "E-mailes támogatás", me: "Email podrška", en: "Email support", ru: "Поддержка по почте", sr: "Email подршка", bs: "Email podrška", hr: "Email podrška", uk: "Підтримка електронною поштою", sq: "Mbështetje me email", el: "Υποστήριξη μέσω email", tr: "E-posta desteği", es: "Soporte por email" }
    ]
  },
  {
    id: "pro",
    name: "Profi",
    tagline: { hu: "Növekvő irodáknak, több hirdetéssel.", me: "Za agencije u rastu.", en: "For growing agencies.", ru: "Для растущих агентств.", sr: "За агенције у расту.", bs: "Za agencije u rastu.", hr: "Za agencije u rastu.", uk: "Для агентств, що зростають.", sq: "Për agjenci në rritje.", el: "Για αναπτυσσόμενα μεσιτικά γραφεία.", tr: "Büyüyen acenteler için.", es: "Para agencias en crecimiento." },
    monthly: 79,
    yearly: 790,
    popular: true,
    features: [
      { hu: "50 aktív hirdetés", me: "50 aktivnih oglasa", en: "50 active listings", ru: "50 активных объявлений", sr: "50 активних огласа", bs: "50 aktivnih oglasa", hr: "50 aktivnih oglasa", uk: "50 активних оголошень", sq: "50 shpallje aktive", el: "50 ενεργές αγγελίες", tr: "50 aktif ilan", es: "50 anuncios activos" },
      { hu: "5 kiemelés / hó", me: "5 izdvajanja / mj.", en: "5 featured boosts / mo", ru: "5 продвижений / мес", sr: "5 издвајања / мес.", bs: "5 izdvajanja / mj.", hr: "5 izdvajanja / mj.", uk: "5 просувань / міс.", sq: "5 promovime të veçuara / muaj", el: "5 προβολές προώθησης / μήνα", tr: "Ayda 5 öne çıkarma", es: "5 impulsos destacados / mes" },
      { hu: "Részletes statisztikák", me: "Detaljna statistika", en: "Detailed stats", ru: "Подробная статистика", sr: "Детаљна статистика", bs: "Detaljna statistika", hr: "Detaljna statistika", uk: "Детальна статистика", sq: "Statistika të detajuara", el: "Λεπτομερή στατιστικά", tr: "Ayrıntılı istatistikler", es: "Estadísticas detalladas" },
      { hu: "Kiemelt iroda-profil", me: "Istaknuti profil agencije", en: "Featured agency profile", ru: "Выделенный профиль", sr: "Истакнути профил агенције", bs: "Istaknuti profil agencije", hr: "Istaknuti profil agencije", uk: "Виділений профіль агентства", sq: "Profil agjencie i veçuar", el: "Προβεβλημένο προφίλ γραφείου", tr: "Öne çıkan acente profili", es: "Perfil de agencia destacado" },
      { hu: "3 csapattag", me: "3 člana tima", en: "3 team members", ru: "3 пользователя", sr: "3 члана тима", bs: "3 člana tima", hr: "3 člana tima", uk: "3 учасники команди", sq: "3 anëtarë ekipi", el: "3 μέλη ομάδας", tr: "3 ekip üyesi", es: "3 miembros del equipo" },
      { hu: "Prioritásos támogatás", me: "Prioritetna podrška", en: "Priority support", ru: "Приоритетная поддержка", sr: "Приоритетна подршка", bs: "Prioritetna podrška", hr: "Prioritetna podrška", uk: "Пріоритетна підтримка", sq: "Mbështetje me prioritet", el: "Υποστήριξη με προτεραιότητα", tr: "Öncelikli destek", es: "Soporte prioritario" }
    ]
  },
  {
    id: "premium",
    name: "Prémium",
    tagline: { hu: "Nagy irodáknak, korlátlan kínálattal.", me: "Za velike agencije.", en: "For large agencies.", ru: "Для крупных агентств.", sr: "За велике агенције.", bs: "Za velike agencije.", hr: "Za velike agencije.", uk: "Для великих агентств.", sq: "Për agjenci të mëdha.", el: "Για μεγάλα μεσιτικά γραφεία.", tr: "Büyük acenteler için.", es: "Para grandes agencias." },
    monthly: 199,
    yearly: 1990,
    features: [
      { hu: "Korlátlan hirdetés", me: "Neograničeno oglasa", en: "Unlimited listings", ru: "Безлимит объявлений", sr: "Неограничено огласа", bs: "Neograničeno oglasa", hr: "Neograničeno oglasa", uk: "Необмежена кількість оголошень", sq: "Shpallje të pakufizuara", el: "Απεριόριστες αγγελίες", tr: "Sınırsız ilan", es: "Anuncios ilimitados" },
      { hu: "20 kiemelés / hó + főoldal", me: "20 izdvajanja + naslovna", en: "20 boosts + homepage", ru: "20 продвижений + главная", sr: "20 издвајања + насловна", bs: "20 izdvajanja + naslovna", hr: "20 izdvajanja + naslovnica", uk: "20 просувань + головна", sq: "20 promovime + faqja kryesore", el: "20 προωθήσεις + αρχική σελίδα", tr: "20 öne çıkarma + ana sayfa", es: "20 impulsos + portada" },
      { hu: "Teljes analitika + piactér", me: "Puna analitika + tržište", en: "Full analytics + market", ru: "Полная аналитика", sr: "Пуна аналитика + тржиште", bs: "Puna analitika + tržište", hr: "Puna analitika + tržište", uk: "Повна аналітика + ринок", sq: "Analitikë e plotë + tregu", el: "Πλήρη analytics + αγορά", tr: "Tam analiz + pazar", es: "Analítica completa + mercado" },
      { hu: "Korlátlan csapattag", me: "Neograničeno članova", en: "Unlimited members", ru: "Безлимит пользователей", sr: "Неограничено чланова", bs: "Neograničeno članova", hr: "Neograničeno članova", uk: "Необмежена кількість учасників", sq: "Anëtarë të pakufizuar", el: "Απεριόριστα μέλη", tr: "Sınırsız üye", es: "Miembros ilimitados" },
      { hu: "Feed-import (API)", me: "Uvoz feeda (API)", en: "Feed import (API)", ru: "Импорт фида (API)", sr: "Увоз feeda (API)", bs: "Uvoz feeda (API)", hr: "Uvoz feeda (API)", uk: "Імпорт фіду (API)", sq: "Importim feedi (API)", el: "Εισαγωγή feed (API)", tr: "Feed içe aktarma (API)", es: "Importación de feed (API)" },
      { hu: "Dedikált menedzser", me: "Posvećeni menadžer", en: "Dedicated manager", ru: "Персональный менеджер", sr: "Посвећени менаџер", bs: "Posvećeni menadžer", hr: "Posvećeni menadžer", uk: "Персональний менеджер", sq: "Menaxher i dedikuar", el: "Αποκλειστικός διαχειριστής", tr: "Özel müşteri yöneticisi", es: "Gestor dedicado" }
    ]
  }
];

const FAQ: { q: PL; a: PL }[] = [
  {
    q: { hu: "Bármikor válthatok csomagot?", me: "Mogu li promijeniti paket?", en: "Can I switch plans anytime?", ru: "Можно менять тариф?", sr: "Могу ли да променим пакет?", bs: "Mogu li promijeniti paket bilo kada?", hr: "Mogu li promijeniti paket bilo kada?", uk: "Чи можу я змінювати тариф будь-коли?", sq: "A mund të ndryshoj paketën në çdo kohë?", el: "Μπορώ να αλλάξω πακέτο οποιαδήποτε στιγμή;", tr: "Paketimi istediğim zaman değiştirebilir miyim?", es: "¿Puedo cambiar de plan cuando quiera?" },
    a: { hu: "Igen, bármikor válthatsz feljebb vagy lejjebb; a különbözetet arányosan számoljuk.", me: "Da, u svakom trenutku; razliku obračunavamo srazmjerno.", en: "Yes, upgrade or downgrade anytime — we prorate the difference.", ru: "Да, в любой момент — разницу пересчитываем пропорционально.", sr: "Да, у сваком тренутку; разлику обрачунавамо сразмерно.", bs: "Da, u svakom trenutku možete preći na viši ili niži paket — razliku obračunavamo srazmjerno.", hr: "Da, u svakom trenutku možete prijeći na viši ili niži paket — razliku obračunavamo razmjerno.", uk: "Так, підвищуйте або знижуйте тариф будь-коли — ми пропорційно перераховуємо різницю.", sq: "Po, përmirëso ose ul nivelin në çdo kohë — diferencën e llogarisim në mënyrë proporcionale.", el: "Ναι, αναβαθμίστε ή υποβαθμίστε οποτεδήποτε — υπολογίζουμε αναλογικά τη διαφορά.", tr: "Evet, dilediğiniz zaman yükseltin veya düşürün — farkı orantılı olarak hesaplarız.", es: "Sí, sube o baja de plan cuando quieras: prorrateamos la diferencia." }
  },
  {
    q: { hu: "Mi történik a hirdetéseimmel, ha lejár?", me: "Šta biva sa oglasima po isteku?", en: "What happens to my listings if it lapses?", ru: "Что с объявлениями по истечении?", sr: "Шта бива са огласима по истеку?", bs: "Šta se dešava s mojim oglasima po isteku?", hr: "Što se događa s mojim oglasima nakon isteka?", uk: "Що станеться з моїми оголошеннями, якщо підписка спливе?", sq: "Çfarë ndodh me shpalljet e mia nëse skadon?", el: "Τι συμβαίνει με τις αγγελίες μου αν λήξει;", tr: "Aboneliğim biterse ilanlarım ne olur?", es: "¿Qué pasa con mis anuncios si caduca?" },
    a: { hu: "A hirdetéseid szüneteltetve maradnak 30 napig, így megújításkor egy kattintással visszakapcsolhatók.", me: "Oglasi ostaju pauzirani 30 dana i vraćaju se jednim klikom.", en: "Your listings are paused for 30 days and restored with one click on renewal.", ru: "Объявления ставятся на паузу на 30 дней и возвращаются одним кликом.", sr: "Огласи остају паузирани 30 дана и враћају се једним кликом.", bs: "Vaši oglasi ostaju pauzirani 30 dana i vraćaju se jednim klikom pri obnovi.", hr: "Vaši oglasi ostaju pauzirani 30 dana i vraćaju se jednim klikom pri obnovi.", uk: "Ваші оголошення призупиняються на 30 днів і відновлюються одним кліком при поновленні.", sq: "Shpalljet tuaja pauzohen për 30 ditë dhe rikthehen me një klik pas rinovimit.", el: "Οι αγγελίες σας τίθενται σε παύση για 30 ημέρες και αποκαθίστανται με ένα κλικ κατά την ανανέωση.", tr: "İlanlarınız 30 gün boyunca duraklatılır ve yenilemede tek tıkla geri gelir.", es: "Tus anuncios se pausan durante 30 días y se restauran con un clic al renovar." }
  },
  {
    q: { hu: "Magánszemélyként is kell fizetnem?", me: "Plaćaju li fizička lica?", en: "Do private sellers pay?", ru: "Платят ли частные лица?", sr: "Плаћају ли физичка лица?", bs: "Plaćaju li fizička lica?", hr: "Plaćaju li fizičke osobe?", uk: "Чи платять приватні продавці?", sq: "A paguajnë shitësit privatë?", el: "Πληρώνουν οι ιδιώτες πωλητές;", tr: "Bireysel satıcılar ücret öder mi?", es: "¿Pagan los vendedores particulares?" },
    a: { hu: "Nem. Magánszemélyként akár 3 hirdetést ingyen adhatsz fel; előfizetés csak irodáknak kell.", me: "Ne. Do 3 oglasa besplatno; pretplata je samo za agencije.", en: "No. Up to 3 free listings for private sellers; subscriptions are for agencies only.", ru: "Нет. До 3 бесплатных объявлений; подписка только для агентств.", sr: "Не. До 3 огласа бесплатно; претплата је само за агенције.", bs: "Ne. Do 3 besplatna oglasa za fizička lica; pretplata je samo za agencije.", hr: "Ne. Do 3 besplatna oglasa za fizičke osobe; pretplate su samo za agencije.", uk: "Ні. До 3 безкоштовних оголошень для приватних продавців; підписки лише для агентств.", sq: "Jo. Deri në 3 shpallje falas për shitësit privatë; abonimet janë vetëm për agjenci.", el: "Όχι. Έως 3 δωρεάν αγγελίες για ιδιώτες πωλητές· οι συνδρομές είναι μόνο για μεσιτικά γραφεία.", tr: "Hayır. Bireysel satıcılar için en fazla 3 ücretsiz ilan; abonelikler yalnızca acentelere yöneliktir.", es: "No. Hasta 3 anuncios gratuitos para particulares; las suscripciones son solo para agencias." }
  },
  {
    q: { hu: "Milyen fizetési módokat fogadtok el?", me: "Koje načine plaćanja primate?", en: "Which payment methods do you accept?", ru: "Какие способы оплаты?", sr: "Које начине плаћања примате?", bs: "Koje načine plaćanja primate?", hr: "Koje načine plaćanja prihvaćate?", uk: "Які способи оплати ви приймаєте?", sq: "Cilat mënyra pagese pranoni?", el: "Ποιους τρόπους πληρωμής δέχεστε;", tr: "Hangi ödeme yöntemlerini kabul ediyorsunuz?", es: "¿Qué métodos de pago aceptáis?" },
    a: { hu: "Bankkártyát (Visa, Mastercard) és a helyi banki átutalást; a számlát automatikusan kiállítjuk.", me: "Kartice (Visa, Mastercard) i bankovni prenos; račun se izdaje automatski.", en: "Cards (Visa, Mastercard) and local bank transfer; invoices are issued automatically.", ru: "Карты (Visa, Mastercard) и банковский перевод; счёт выставляется автоматически.", sr: "Картице (Visa, Mastercard) и банковни пренос; рачун се издаје аутоматски.", bs: "Kartice (Visa, Mastercard) i lokalni bankovni prenos; računi se izdaju automatski.", hr: "Kartice (Visa, Mastercard) i lokalni bankovni prijenos; računi se izdaju automatski.", uk: "Картки (Visa, Mastercard) і місцевий банківський переказ; рахунки-фактури виставляються автоматично.", sq: "Karta (Visa, Mastercard) dhe transfertë bankare lokale; faturat lëshohen automatikisht.", el: "Κάρτες (Visa, Mastercard) και τοπικό τραπεζικό έμβασμα· τα τιμολόγια εκδίδονται αυτόματα.", tr: "Kartlar (Visa, Mastercard) ve yerel banka havalesi; faturalar otomatik olarak düzenlenir.", es: "Tarjetas (Visa, Mastercard) y transferencia bancaria local; las facturas se emiten automáticamente." }
  },
  {
    q: { hu: "Van ingyenes próbaidőszak?", me: "Postoji li besplatan probni period?", en: "Is there a free trial?", ru: "Есть ли пробный период?", sr: "Постоји ли бесплатан пробни период?", bs: "Postoji li besplatan probni period?", hr: "Postoji li besplatno probno razdoblje?", uk: "Чи є безкоштовний пробний період?", sq: "A ka një provë falas?", el: "Υπάρχει δωρεάν δοκιμή;", tr: "Ücretsiz deneme var mı?", es: "¿Hay una prueba gratuita?" },
    a: { hu: "Igen — az első irodai regisztrációnál 14 nap ingyenes Profi próba, kártya-terhelés nélkül.", me: "Da — 14 dana besplatne Profi probe pri prvoj registraciji agencije.", en: "Yes — a 14-day free Pro trial on your first agency sign-up, no charge upfront.", ru: "Да — 14 дней бесплатного Pro при первой регистрации агентства.", sr: "Да — 14 дана бесплатне Профи пробе при првој регистрацији агенције.", bs: "Da — 14 dana besplatne Profi probe pri prvoj registraciji agencije, bez naplate unaprijed.", hr: "Da — 14-dnevna besplatna Pro proba pri prvoj registraciji agencije, bez naplate unaprijed.", uk: "Так — 14-денна безкоштовна пробна версія Pro при першій реєстрації агентства, без оплати наперед.", sq: "Po — një provë Pro falas 14-ditore në regjistrimin e parë të agjencisë, pa asnjë tarifë paraprake.", el: "Ναι — δωρεάν δοκιμή Pro 14 ημερών κατά την πρώτη εγγραφή γραφείου, χωρίς προκαταβολική χρέωση.", tr: "Evet — ilk acente kaydınızda 14 günlük ücretsiz Pro denemesi, peşin ödeme yok.", es: "Sí: 14 días de prueba Pro gratuita al registrar tu primera agencia, sin cargo por adelantado." }
  },
  {
    q: { hu: "Mit jelent a kiemelés?", me: "Šta znači isticanje?", en: "What does a boost mean?", ru: "Что такое продвижение?", sr: "Шта значи истицање?", bs: "Šta znači izdvajanje?", hr: "Što znači izdvajanje?", uk: "Що означає просування?", sq: "Çfarë do të thotë një promovim?", el: "Τι σημαίνει η προώθηση;", tr: "Öne çıkarma ne demek?", es: "¿Qué significa un impulso?" },
    a: { hu: "A kiemelt hirdetés a listák elején és a főoldalon is megjelenik, kiemelt jelöléssel — jóval több megtekintést hoz.", me: "Istaknuti oglas je na vrhu liste i na naslovnoj, uz oznaku — donosi više pregleda.", en: "A boosted listing appears at the top of results and on the homepage with a badge — far more views.", ru: "Продвинутое объявление показывается вверху и на главной — гораздо больше просмотров.", sr: "Истакнути оглас је на врху листе и на насловној, уз ознаку — доноси више прегледа.", bs: "Izdvojeni oglas prikazuje se na vrhu rezultata i na naslovnoj stranici uz oznaku — donosi znatno više pregleda.", hr: "Izdvojeni oglas prikazuje se na vrhu rezultata i na naslovnici uz oznaku — znatno više pregleda.", uk: "Просунуте оголошення з'являється вгорі результатів і на головній сторінці з позначкою — значно більше переглядів.", sq: "Një shpallje e promovuar shfaqet në krye të rezultateve dhe në faqen kryesore me një shenjë — shumë më tepër shikime.", el: "Μια προωθημένη αγγελία εμφανίζεται στην κορυφή των αποτελεσμάτων και στην αρχική σελίδα με σήμανση — πολύ περισσότερες προβολές.", tr: "Öne çıkarılan bir ilan, sonuçların en üstünde ve ana sayfada bir rozetle görünür — çok daha fazla görüntülenme.", es: "Un anuncio impulsado aparece en lo alto de los resultados y en la portada con un distintivo: muchas más visitas." }
  },
  {
    q: { hu: "Több felhasználó kezelheti az iroda fiókját?", me: "Može li više korisnika upravljati nalogom?", en: "Can multiple users manage the account?", ru: "Могут ли несколько сотрудников?", sr: "Може ли више корисника управљати налогом?", bs: "Može li više korisnika upravljati nalogom?", hr: "Može li više korisnika upravljati računom?", uk: "Чи можуть декілька користувачів керувати рахунком?", sq: "A mund të menaxhojnë llogarinë disa përdorues?", el: "Μπορούν πολλοί χρήστες να διαχειρίζονται τον λογαριασμό;", tr: "Hesabı birden fazla kullanıcı yönetebilir mi?", es: "¿Pueden varios usuarios gestionar la cuenta?" },
    a: { hu: "Igen. A Profi 3, a Prémium korlátlan csapattagot enged — mindenki a saját belépésével dolgozik.", me: "Da. Profi 3, Premium neograničeno članova.", en: "Yes. Pro allows 3 members, Premium unlimited — each with their own login.", ru: "Да. Pro — 3, Premium — без ограничений.", sr: "Да. Профи 3, Премиум неограничено чланова.", bs: "Da. Profi omogućava 3 člana, Premium neograničeno — svaki sa vlastitom prijavom.", hr: "Da. Pro dopušta 3 člana, Premium neograničeno — svaki sa svojom prijavom.", uk: "Так. Pro дозволяє 3 учасників, Premium — необмежену кількість, кожен зі своїм логіном.", sq: "Po. Pro lejon 3 anëtarë, Premium të pakufizuar — secili me hyrjen e vet.", el: "Ναι. Το Pro επιτρέπει 3 μέλη, το Premium απεριόριστα — καθένα με τα δικά του στοιχεία σύνδεσης.", tr: "Evet. Pro 3 üyeye, Premium ise sınırsıza izin verir — her biri kendi girişiyle.", es: "Sí. Pro permite 3 miembros, Premium ilimitados, cada uno con su propio acceso." }
  },
  {
    q: { hu: "Kapok számlát?", me: "Dobijam li račun?", en: "Do I get an invoice?", ru: "Будет ли счёт?", sr: "Добијам ли рачун?", bs: "Dobijam li račun?", hr: "Dobivam li račun?", uk: "Чи отримаю я рахунок-фактуру?", sq: "A marr një faturë?", el: "Λαμβάνω τιμολόγιο;", tr: "Fatura alıyor muyum?", es: "¿Recibo una factura?" },
    a: { hu: "Minden fizetésről automatikus, letölthető számlát adunk a cég adataival.", me: "Za svako plaćanje izdajemo automatski račun.", en: "Every payment gets an automatic, downloadable invoice with your company details.", ru: "На каждый платёж — автоматический счёт с реквизитами.", sr: "За свако плаћање издајемо аутоматски рачун.", bs: "Za svako plaćanje dobijate automatski račun za preuzimanje sa podacima vaše firme.", hr: "Za svako plaćanje dobivate automatski račun za preuzimanje s podacima vaše tvrtke.", uk: "На кожен платіж видається автоматичний рахунок-фактура для завантаження з реквізитами вашої компанії.", sq: "Çdo pagesë merr një faturë automatike, të shkarkueshme me të dhënat e kompanisë suaj.", el: "Κάθε πληρωμή λαμβάνει αυτόματο, λήψιμο τιμολόγιο με τα στοιχεία της εταιρείας σας.", tr: "Her ödeme için şirket bilgilerinizle otomatik, indirilebilir bir fatura düzenlenir.", es: "Cada pago genera una factura automática y descargable con los datos de tu empresa." }
  },
  {
    q: { hu: "Felmondhatom bármikor?", me: "Mogu li otkazati bilo kada?", en: "Can I cancel anytime?", ru: "Можно отменить в любой момент?", sr: "Могу ли да откажем било када?", bs: "Mogu li otkazati bilo kada?", hr: "Mogu li otkazati bilo kada?", uk: "Чи можу я скасувати будь-коли?", sq: "A mund të anuloj në çdo kohë?", el: "Μπορώ να ακυρώσω οποιαδήποτε στιγμή;", tr: "İstediğim zaman iptal edebilir miyim?", es: "¿Puedo cancelar cuando quiera?" },
    a: { hu: "Igen, kötöttség nélkül. A felmondás a következő számlázási időszak elejétől lép életbe.", me: "Da, bez obaveza; otkaz važi od sljedećeg perioda.", en: "Yes, no lock-in. Cancellation takes effect from the next billing period.", ru: "Да, без обязательств. С начала следующего периода.", sr: "Да, без обавеза; отказ важи од следећег периода.", bs: "Da, bez obaveza. Otkaz stupa na snagu od sljedećeg obračunskog perioda.", hr: "Da, bez obveza. Otkaz stupa na snagu od sljedećeg obračunskog razdoblja.", uk: "Так, без прив'язки. Скасування набирає чинності з наступного розрахункового періоду.", sq: "Po, pa detyrim. Anulimi hyn në fuqi nga periudha e ardhshme e faturimit.", el: "Ναι, χωρίς δέσμευση. Η ακύρωση ισχύει από την επόμενη περίοδο χρέωσης.", tr: "Evet, bağlayıcılık yok. İptal, bir sonraki fatura döneminden itibaren geçerli olur.", es: "Sí, sin permanencia. La cancelación surte efecto desde el siguiente periodo de facturación." }
  },
  {
    q: { hu: "Importálhatom a meglévő hirdetéseimet?", me: "Mogu li uvezti postojeće oglase?", en: "Can I import my existing listings?", ru: "Можно импортировать объявления?", sr: "Могу ли да увезем постојеће огласе?", bs: "Mogu li uvesti svoje postojeće oglase?", hr: "Mogu li uvesti svoje postojeće oglase?", uk: "Чи можу я імпортувати наявні оголошення?", sq: "A mund t'i importoj shpalljet e mia ekzistuese?", el: "Μπορώ να εισαγάγω τις υπάρχουσες αγγελίες μου;", tr: "Mevcut ilanlarımı içe aktarabilir miyim?", es: "¿Puedo importar mis anuncios existentes?" },
    a: { hu: "A Prémium csomag feed-importot (API) kínál, így a meglévő rendszeredből automatikusan behozhatók a hirdetések.", me: "Premium nudi uvoz feeda (API).", en: "The Premium plan offers feed import (API) to pull listings from your existing system automatically.", ru: "Premium поддерживает импорт фида (API).", sr: "Премиум нуди увоз feeda (API).", bs: "Premium paket nudi uvoz feeda (API) za automatsko preuzimanje oglasa iz vašeg postojećeg sistema.", hr: "Premium paket nudi uvoz feeda (API) za automatsko preuzimanje oglasa iz vašeg postojećeg sustava.", uk: "Тариф Premium пропонує імпорт фіду (API) для автоматичного перенесення оголошень з вашої наявної системи.", sq: "Paketa Premium ofron importim feedi (API) për të tërhequr shpalljet nga sistemi juaj ekzistues automatikisht.", el: "Το πακέτο Premium προσφέρει εισαγωγή feed (API) για αυτόματη άντληση αγγελιών από το υπάρχον σύστημά σας.", tr: "Premium paketi, ilanları mevcut sisteminizden otomatik çekmek için feed içe aktarma (API) sunar.", es: "El plan Premium ofrece importación de feed (API) para traer los anuncios de tu sistema actual de forma automática." }
  }
];

// Magánszemélyre szabott GYIK.
const PRIVATE_FAQ: typeof FAQ = [
  {
    q: { hu: "Hány hirdetést adhatok fel ingyen?", me: "Koliko oglasa besplatno?", en: "How many listings can I post free?", ru: "Сколько объявлений бесплатно?", sr: "Колико огласа бесплатно?", bs: "Koliko oglasa mogu objaviti besplatno?", hr: "Koliko oglasa mogu objaviti besplatno?", uk: "Скільки оголошень я можу розмістити безкоштовно?", sq: "Sa shpallje mund të publikoj falas?", el: "Πόσες αγγελίες μπορώ να αναρτήσω δωρεάν;", tr: "Ücretsiz kaç ilan yayınlayabilirim?", es: "¿Cuántos anuncios puedo publicar gratis?" },
    a: { hu: "Magánszemélyként 3 hirdetést adhatsz fel teljesen ingyen, előfizetés nélkül.", me: "Kao fizičko lice 3 oglasa potpuno besplatno.", en: "As a private seller you can post 3 listings completely free, no subscription.", ru: "Как частное лицо — 3 объявления бесплатно.", sr: "Као физичко лице 3 огласа потпуно бесплатно.", bs: "Kao fizičko lice možete objaviti 3 oglasa potpuno besplatno, bez pretplate.", hr: "Kao fizička osoba možete objaviti 3 oglasa potpuno besplatno, bez pretplate.", uk: "Як приватний продавець ви можете розмістити 3 оголошення абсолютно безкоштовно, без підписки.", sq: "Si shitës privat mund të publikosh 3 shpallje krejtësisht falas, pa abonim.", el: "Ως ιδιώτης πωλητής μπορείτε να αναρτήσετε 3 αγγελίες εντελώς δωρεάν, χωρίς συνδρομή.", tr: "Bireysel satıcı olarak 3 ilanı abonelik olmadan tamamen ücretsiz yayınlayabilirsiniz.", es: "Como vendedor particular puedes publicar 3 anuncios totalmente gratis, sin suscripción." }
  },
  {
    q: { hu: "Mi van, ha 3-nál több hirdetést szeretnék?", me: "Šta ako želim više od 3?", en: "What if I want more than 3 listings?", ru: "А если нужно больше 3?", sr: "Шта ако желим више од 3?", bs: "Šta ako želim više od 3 oglasa?", hr: "Što ako želim više od 3 oglasa?", uk: "А якщо я хочу більше ніж 3 оголошення?", sq: "Po sikur të dua më shumë se 3 shpallje?", el: "Τι γίνεται αν θέλω περισσότερες από 3 αγγελίες;", tr: "3'ten fazla ilan istersem ne olur?", es: "¿Y si quiero más de 3 anuncios?" },
    a: { hu: "Ha rendszeresen több ingatlant hirdetnél, az irodai (Ingatlaniroda) fiók a megfelelő — ott előfizetéssel 10-től korlátlanig terjedhet a hirdetésszám. A profilodban bármikor válthatsz irodai fiókra.", me: "Za više oglasa je pravi agencijski nalog (od 10 do neograničeno uz pretplatu).", en: "If you regularly list several properties, an agency account is the right fit — with a plan you get from 10 up to unlimited listings. You can switch to an agency account anytime in your profile.", ru: "Для большего числа объявлений подойдёт аккаунт агентства (от 10 до безлимита по подписке).", sr: "За више огласа је прави агенцијски налог (од 10 до неограничено уз претплату).", bs: "Ako redovno oglašavate više nekretnina, agencijski nalog je pravo rješenje — uz paket dobijate od 10 do neograničeno oglasa. Na agencijski nalog možete preći bilo kada u svom profilu.", hr: "Ako redovito objavljujete više nekretnina, agencijski račun je pravi izbor — uz paket dobivate od 10 do neograničeno oglasa. Na agencijski račun možete prijeći bilo kada u svom profilu.", uk: "Якщо ви регулярно розміщуєте кілька об'єктів нерухомості, вам підійде рахунок агентства — з тарифом ви отримуєте від 10 до необмеженої кількості оголошень. Ви можете перейти на рахунок агентства будь-коли у своєму профілі.", sq: "Nëse publikon rregullisht disa prona, një llogari agjencie është zgjidhja e duhur — me një paketë merr nga 10 deri në shpallje të pakufizuara. Mund të kalosh në një llogari agjencie në çdo kohë te profili yt.", el: "Αν αναρτάτε τακτικά πολλά ακίνητα, ο λογαριασμός γραφείου είναι η σωστή επιλογή — με ένα πακέτο έχετε από 10 έως απεριόριστες αγγελίες. Μπορείτε να μεταβείτε σε λογαριασμό γραφείου οποτεδήποτε από το προφίλ σας.", tr: "Düzenli olarak birden fazla mülk ilan veriyorsanız, doğru seçenek acente hesabıdır — bir paketle 10'dan sınırsıza kadar ilan alırsınız. Profilinizden istediğiniz zaman acente hesabına geçebilirsiniz.", es: "Si publicas varios inmuebles con regularidad, una cuenta de agencia es lo ideal: con un plan tienes desde 10 hasta anuncios ilimitados. Puedes cambiar a una cuenta de agencia cuando quieras desde tu perfil." }
  },
  {
    q: { hu: "Mennyibe kerül a kiemelés?", me: "Koliko košta isticanje?", en: "How much is a boost?", ru: "Сколько стоит продвижение?", sr: "Колико кошта истицање?", bs: "Koliko košta izdvajanje?", hr: "Koliko košta izdvajanje?", uk: "Скільки коштує просування?", sq: "Sa kushton një promovim?", el: "Πόσο κοστίζει μια προώθηση;", tr: "Öne çıkarma ne kadar?", es: "¿Cuánto cuesta un impulso?" },
    a: { hu: "Egy-egy hirdetést kiemelhetsz 7 napra 5 €-ért, vagy 30 napra 15 €-ért — így a listák elején és a főoldalon is megjelenik.", me: "Isticanje 7 dana 5 €, 30 dana 15 € po oglasu.", en: "You can boost a listing for 7 days for €5, or 30 days for €15 — it then appears at the top of results and on the homepage.", ru: "Продвижение объявления: 7 дней — 5 €, 30 дней — 15 €.", sr: "Истицање 7 дана 5 €, 30 дана 15 € по огласу.", bs: "Oglas možete izdvojiti na 7 dana za €5 ili na 30 dana za €15 — tada se prikazuje na vrhu rezultata i na naslovnoj stranici.", hr: "Oglas možete izdvojiti na 7 dana za 5 € ili na 30 dana za 15 € — tada se prikazuje na vrhu rezultata i na naslovnici.", uk: "Ви можете просувати оголошення протягом 7 днів за €5 або 30 днів за €15 — тоді воно з'являється вгорі результатів і на головній сторінці.", sq: "Mund të promovosh një shpallje për 7 ditë me €5, ose 30 ditë me €15 — pastaj shfaqet në krye të rezultateve dhe në faqen kryesore.", el: "Μπορείτε να προωθήσετε μια αγγελία για 7 ημέρες με €5, ή για 30 ημέρες με €15 — τότε εμφανίζεται στην κορυφή των αποτελεσμάτων και στην αρχική σελίδα.", tr: "Bir ilanı 7 gün için €5 veya 30 gün için €15 karşılığında öne çıkarabilirsiniz — ardından sonuçların en üstünde ve ana sayfada görünür.", es: "Puedes impulsar un anuncio 7 días por 5 €, o 30 días por 15 €: entonces aparece en lo alto de los resultados y en la portada." }
  },
  {
    q: { hu: "Meddig aktív a hirdetésem?", me: "Koliko je oglas aktivan?", en: "How long is my listing active?", ru: "Как долго активно объявление?", sr: "Колико је оглас активан?", bs: "Koliko dugo je moj oglas aktivan?", hr: "Koliko je moj oglas aktivan?", uk: "Як довго моє оголошення активне?", sq: "Sa kohë qëndron aktive shpallja ime?", el: "Για πόσο καιρό είναι ενεργή η αγγελία μου;", tr: "İlanım ne kadar süre aktif kalır?", es: "¿Cuánto tiempo está activo mi anuncio?" },
    a: { hu: "A hirdetésed addig aktív, amíg te el nem adod/ki nem adod, vagy le nem veszed — nincs lejárat.", me: "Oglas je aktivan dok ga ne prodaš/ukloniš — bez isteka.", en: "Your listing stays active until you sell/rent or remove it — there's no expiry.", ru: "Объявление активно, пока вы его не снимете — без срока.", sr: "Оглас је активан док га не продаш/уклониш — без истека.", bs: "Vaš oglas ostaje aktivan dok ga ne prodate/iznajmite ili uklonite — bez isteka.", hr: "Vaš oglas ostaje aktivan dok ne prodate/iznajmite ili ga uklonite — bez isteka.", uk: "Ваше оголошення залишається активним, доки ви не продасте/здасте або не видалите його — без терміну дії.", sq: "Shpallja jote qëndron aktive derisa ta shesësh/japësh me qira ose ta heqësh — nuk ka skadim.", el: "Η αγγελία σας παραμένει ενεργή έως ότου πουλήσετε/ενοικιάσετε ή την αφαιρέσετε — δεν υπάρχει λήξη.", tr: "İlanınız satana/kiralayana veya kaldırana kadar aktif kalır — süre dolması yoktur.", es: "Tu anuncio permanece activo hasta que vendas/alquiles o lo elimines: no caduca." }
  },
  {
    q: { hu: "Kommunikálhatok a vevőkkel?", me: "Mogu li komunicirati s kupcima?", en: "Can I talk to buyers?", ru: "Могу ли я общаться с покупателями?", sr: "Могу ли да комуницирам са купцима?", bs: "Mogu li komunicirati s kupcima?", hr: "Mogu li komunicirati s kupcima?", uk: "Чи можу я спілкуватися з покупцями?", sq: "A mund të flas me blerësit?", el: "Μπορώ να μιλήσω με τους αγοραστές;", tr: "Alıcılarla konuşabilir miyim?", es: "¿Puedo hablar con los compradores?" },
    a: { hu: "Igen, a beépített üzenetküldővel közvetlenül chatelhetsz az érdeklődőkkel — élő fordítással is.", me: "Da, ugrađeni chat sa prevodom uživo.", en: "Yes, message interested buyers directly with the built-in chat — with live translation too.", ru: "Да, встроенный чат с живым переводом.", sr: "Да, уграђени chat са преводом уживо.", bs: "Da, zainteresovanim kupcima možete pisati direktno putem ugrađenog chata — uz prevod uživo.", hr: "Da, izravno šaljite poruke zainteresiranim kupcima putem ugrađenog chata — uz prijevod uživo.", uk: "Так, пишіть зацікавленим покупцям безпосередньо у вбудованому чаті — з живим перекладом.", sq: "Po, dërgo mesazhe drejtpërdrejt blerësve të interesuar me chatin e integruar — edhe me përkthim të drejtpërdrejtë.", el: "Ναι, στείλτε μηνύματα απευθείας σε ενδιαφερόμενους αγοραστές με το ενσωματωμένο chat — με ζωντανή μετάφραση επίσης.", tr: "Evet, ilgilenen alıcılara yerleşik sohbetle doğrudan mesaj gönderin — üstelik canlı çeviriyle.", es: "Sí, escribe directamente a los compradores interesados con el chat integrado, con traducción en directo incluida." }
  },
  {
    q: { hu: "Kell bankkártya a regisztrációhoz?", me: "Treba li kartica za registraciju?", en: "Do I need a card to sign up?", ru: "Нужна ли карта для регистрации?", sr: "Треба ли картица за регистрацију?", bs: "Treba li mi kartica za registraciju?", hr: "Trebam li karticu za registraciju?", uk: "Чи потрібна картка для реєстрації?", sq: "A më duhet një kartë për t'u regjistruar?", el: "Χρειάζομαι κάρτα για να εγγραφώ;", tr: "Kaydolmak için kart gerekir mi?", es: "¿Necesito una tarjeta para registrarme?" },
    a: { hu: "Nem. A regisztráció és a 3 ingyenes hirdetés kártya nélkül elérhető; kártya csak kiemelésnél kell.", me: "Ne. Registracija i 3 oglasa bez kartice.", en: "No. Signing up and the 3 free listings need no card; a card is only needed for boosts.", ru: "Нет. Регистрация и 3 объявления — без карты.", sr: "Не. Регистрација и 3 огласа без картице.", bs: "Ne. Registracija i 3 besplatna oglasa ne zahtijevaju karticu; kartica je potrebna samo za izdvajanja.", hr: "Ne. Registracija i 3 besplatna oglasa ne zahtijevaju karticu; kartica je potrebna samo za izdvajanja.", uk: "Ні. Для реєстрації та 3 безкоштовних оголошень картка не потрібна; вона потрібна лише для просування.", sq: "Jo. Regjistrimi dhe 3 shpalljet falas nuk kërkojnë kartë; karta nevojitet vetëm për promovimet.", el: "Όχι. Η εγγραφή και οι 3 δωρεάν αγγελίες δεν απαιτούν κάρτα· κάρτα χρειάζεται μόνο για τις προωθήσεις.", tr: "Hayır. Kayıt ve 3 ücretsiz ilan için kart gerekmez; kart yalnızca öne çıkarmalar için gereklidir.", es: "No. El registro y los 3 anuncios gratuitos no requieren tarjeta; solo se necesita para los impulsos." }
  },
  {
    q: { hu: "Láthatom, hányan nézték a hirdetésem?", me: "Vidim li broj pregleda?", en: "Can I see how many viewed my listing?", ru: "Вижу ли просмотры?", sr: "Видим ли број прегледа?", bs: "Mogu li vidjeti koliko je ljudi pogledalo moj oglas?", hr: "Mogu li vidjeti koliko je ljudi pogledalo moj oglas?", uk: "Чи можу я бачити, скільки людей переглянули моє оголошення?", sq: "A mund të shoh sa e panë shpalljen time?", el: "Μπορώ να δω πόσοι είδαν την αγγελία μου;", tr: "İlanımı kaç kişinin görüntülediğini görebilir miyim?", es: "¿Puedo ver cuántos han visto mi anuncio?" },
    a: { hu: "Igen, minden hirdetésnél látod a megtekintések számát a profilodban.", me: "Da, broj pregleda je u profilu.", en: "Yes, you see the view count for each listing in your profile.", ru: "Да, счётчик просмотров в профиле.", sr: "Да, број прегледа је у профилу.", bs: "Da, broj pregleda za svaki oglas vidite u svom profilu.", hr: "Da, broj pregleda za svaki oglas vidite u svom profilu.", uk: "Так, ви бачите кількість переглядів кожного оголошення у своєму профілі.", sq: "Po, sheh numrin e shikimeve për çdo shpallje te profili yt.", el: "Ναι, βλέπετε τον αριθμό προβολών για κάθε αγγελία στο προφίλ σας.", tr: "Evet, her ilanın görüntülenme sayısını profilinizde görürsünüz.", es: "Sí, ves el número de visitas de cada anuncio en tu perfil." }
  },
  {
    q: { hu: "Módosíthatom a feladott hirdetést?", me: "Mogu li urediti oglas?", en: "Can I edit a posted listing?", ru: "Можно ли редактировать?", sr: "Могу ли да уредим оглас?", bs: "Mogu li urediti objavljeni oglas?", hr: "Mogu li urediti objavljeni oglas?", uk: "Чи можу я редагувати розміщене оголошення?", sq: "A mund të redaktoj një shpallje të publikuar?", el: "Μπορώ να επεξεργαστώ μια αναρτημένη αγγελία;", tr: "Yayınlanan bir ilanı düzenleyebilir miyim?", es: "¿Puedo editar un anuncio publicado?" },
    a: { hu: "Természetesen — a Hirdetések kezelése oldalon bármikor szerkesztheted, szüneteltetheted vagy törölheted.", me: "Naravno — u sekciji Upravljanje oglasima bilo kada.", en: "Of course — edit, pause or delete anytime under Manage listings.", ru: "Конечно — в разделе управления объявлениями.", sr: "Наравно — у секцији Управљање огласима било када.", bs: "Naravno — uredite, pauzirajte ili obrišite bilo kada u sekciji Upravljanje oglasima.", hr: "Naravno — uredite, pauzirajte ili izbrišite bilo kada u odjeljku Upravljanje oglasima.", uk: "Звісно — редагуйте, призупиняйте або видаляйте будь-коли в розділі «Керування оголошеннями».", sq: "Sigurisht — redakto, pauzo ose fshi në çdo kohë te Menaxho shpalljet.", el: "Φυσικά — επεξεργαστείτε, θέστε σε παύση ή διαγράψτε οποτεδήποτε στο Διαχείριση αγγελιών.", tr: "Elbette — İlanları yönet bölümünden istediğiniz zaman düzenleyin, duraklatın veya silin.", es: "Por supuesto: edita, pausa o elimina cuando quieras en Gestionar anuncios." }
  }
];

export default function PricingPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const router = useRouter();
  const [yearly, setYearly] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [subBusy, setSubBusy] = useState<SubPlanId | null>(null);

  const isAgency = user?.role === "agency";
  const isPrivate = !!user && user.role !== "agency";

  // Előfizetés indítása: belépés/iroda ellenőrzés → Stripe subscription checkout.
  // Kulcs nélkül (501) a „hamarosan” toastra esik (a demó így is teljes).
  const subscribe = async (plan: SubPlanId) => {
    if (!user) return openAuth("register");
    setSubBusy(plan);
    const res = await db.startSubscription(plan, yearly ? "year" : "month");
    setSubBusy(null);
    if (res.status === "redirect" && res.url) {
      window.location.href = res.url;
    } else if (res.status === "no_key") {
      toast(tr("pricing_soon_toast", lang), "info");
    } else {
      toast(tr("err_generic", lang), "error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeading icon="wallet" className="mb-2">
        {isPrivate ? tr("pricing_private_title", lang) : tr("pricing_title", lang)}
      </PageHeading>
      <p className="max-w-2xl text-sm text-ink-500 sm:text-base">
        {isPrivate ? tr("pricing_private_sub", lang) : tr("pricing_sub", lang)}
      </p>

      {isPrivate ? (
        <PrivatePlans lang={lang} />
      ) : (
        <>
      {/* Havi / Éves kapcsoló */}
      <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white p-1">
        <button
          onClick={() => setYearly(false)}
          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
            !yearly ? "bg-ink-900 text-white shadow-soft" : "text-ink-500 hover:text-ink-900"
          }`}
        >
          {tr("pricing_monthly", lang)}
        </button>
        <button
          onClick={() => setYearly(true)}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition ${
            yearly ? "bg-ink-900 text-white shadow-soft" : "text-ink-500 hover:text-ink-900"
          }`}
        >
          {tr("pricing_yearly", lang)}
          <span className="rounded-full bg-[#c8ff00] px-2 py-0.5 text-[10px] font-black text-ink-950">
            {tr("pricing_save_badge", lang)}
          </span>
        </button>
      </div>

      {/* Csomagok */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {TIERS.map((t) => {
          const price = yearly ? Math.round(t.yearly / 12) : t.monthly;
          return (
            <div
              key={t.id}
              className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-soft transition ${
                t.popular ? "border-2 border-ink-950 shadow-card lg:-translate-y-2" : "border-ink-100"
              }`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-ink-950">
                  {tr("pricing_popular", lang)}
                </span>
              )}
              <h2 className="text-xl font-black tracking-tight text-ink-900">{t.name}</h2>
              <p className="mt-1 min-h-[2.5rem] text-sm text-ink-500">{L(t.tagline, lang)}</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-black tracking-tight text-ink-900">{formatPrice(price, lang)}</span>
                <span className="pb-1 text-sm font-semibold text-ink-400">{tr("pricing_per_month", lang)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-400">
                {yearly
                  ? tr("pricing_billed_yearly", lang).replace("{n}", formatPrice(t.yearly, lang))
                  : " "}
              </p>

              <ul className="mt-5 space-y-2.5">
                {t.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                    <Icon name="check" size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-emerald-500" />
                    {L(f, lang)}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex-1" />
              <button
                onClick={() => subscribe(t.id as SubPlanId)}
                disabled={subBusy === t.id}
                className={`w-full rounded-2xl py-3.5 text-sm font-bold transition active:scale-[0.99] disabled:opacity-70 ${
                  t.popular
                    ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow hover:from-brand-600 hover:to-brand-700"
                    : "border border-ink-200 text-ink-800 hover:border-ink-900 hover:bg-ink-50"
                }`}
              >
                {subBusy === t.id ? "…" : tr("pricing_choose", lang)}
              </button>
            </div>
          );
        })}
      </div>

      {/* Magánszemély-jegyzet (csak kijelentkezve, mert magánszemélynél a fenti
          privát nézet jelenik meg) */}
      {!user && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-ink-100 bg-ink-50/70 p-4">
          <Icon name="user" size={20} className="mt-0.5 shrink-0 text-brand-500" />
          <div className="text-sm text-ink-700">
            {tr("pricing_private_note", lang)}{" "}
            <Link href="/listings/new" className="font-bold text-brand-600 hover:underline">
              {tr("new_listing", lang)}
            </Link>
          </div>
        </div>
      )}
        </>
      )}

      {/* GYIK — 10 kérdés, mindig látható, kinyitható blokkokban. */}
      <div className="mt-10">
        <h2 className="display mb-4 text-2xl text-ink-900">{tr("pricing_faq_title", lang)}</h2>
        <div className="space-y-2.5">
          {(isPrivate ? PRIVATE_FAQ : FAQ).map((item, i) => {
            const open = faqOpen === i;
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
                <button
                  onClick={() => setFaqOpen(open ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="font-bold text-ink-900">{L(item.q, lang)}</span>
                  <Icon
                    name="chevronDown"
                    size={18}
                    strokeWidth={2.2}
                    className={`shrink-0 text-ink-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="animate-fade-in border-t border-ink-100 px-5 py-4 text-sm leading-relaxed text-ink-600">
                    {L(item.a, lang)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Magánszemély nézet: ingyenes csomag + opcionális kiemelés-csomagok. */
function PrivatePlans({ lang }: { lang: Lang }) {
  // Az árak a KÖZÖS forrásból (lib/pricing) jönnek — így nem csúszhatnak szét a
  // ténylegesen számlázott (Stripe) összegtől.
  const boosts = [
    { key: "pricing_boost_7", price: BOOST_PLANS[0].eur, sub: { hu: "gyors löket", me: "brz efekat", en: "quick lift", ru: "быстрый эффект", sr: "брз ефекат", bs: "brz efekat", hr: "brz učinak", uk: "швидкий ефект", sq: "ngritje e shpejtë", el: "γρήγορη ώθηση", tr: "hızlı yükseliş", es: "efecto rápido" } },
    { key: "pricing_boost_30", price: BOOST_PLANS[1].eur, sub: { hu: "legjobb érték", me: "najbolja vrijednost", en: "best value", ru: "лучшая цена", sr: "најбоља вредност", bs: "najbolja vrijednost", hr: "najbolja vrijednost", uk: "найкраща вартість", sq: "vlera më e mirë", el: "καλύτερη αξία", tr: "en iyi değer", es: "mejor relación calidad-precio" }, best: true }
  ];
  return (
    <div className="mt-6 space-y-8">
      {/* Ingyenes csomag — látványos, neon-fekete fejléces kártya. */}
      <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
        <div className="relative overflow-hidden bg-[linear-gradient(115deg,#070708_0%,#0d0d10_45%,#3a4a00_78%,#c8ff00_100%)] px-6 py-7 text-white">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[#c8ff00]/25 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wide">
                {tr("pricing_private_title", lang)}
              </span>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-black tracking-tight">{formatPrice(0, lang)}</span>
                <span className="pb-1.5 text-sm font-semibold text-white/70">/ {tr("pricing_free_name", lang).toLowerCase()}</span>
              </div>
            </div>
            <Link
              href="/listings/new"
              className="rounded-2xl border-2 border-ink-950 bg-[#c8ff00] px-6 py-3 text-sm font-black text-ink-950 shadow-[0_10px_24px_-8px_rgba(160,200,0,0.7)] transition hover:brightness-95"
            >
              {tr("new_listing", lang)}
            </Link>
          </div>
        </div>
        <ul className="grid gap-3 p-6 sm:grid-cols-2">
          {[
            { hu: "3 ingyenes hirdetés", me: "3 besplatna oglasa", en: "3 free listings", ru: "3 бесплатных объявления", sr: "3 бесплатна огласа", bs: "3 besplatna oglasa", hr: "3 besplatna oglasa", uk: "3 безкоштовні оголошення", sq: "3 shpallje falas", el: "3 δωρεάν αγγελίες", tr: "3 ücretsiz ilan", es: "3 anuncios gratuitos" },
            { hu: "Térképes megjelenés", me: "Prikaz na mapi", en: "Map placement", ru: "Показ на карте", sr: "Приказ на мапи", bs: "Prikaz na mapi", hr: "Prikaz na karti", uk: "Розміщення на карті", sq: "Vendosje në hartë", el: "Τοποθέτηση στον χάρτη", tr: "Haritada gösterim", es: "Ubicación en el mapa" },
            { hu: "Üzenetváltás a vevőkkel (élő fordítással)", me: "Poruke sa kupcima", en: "Messaging with buyers (live translation)", ru: "Чат с покупателями", sr: "Поруке са купцима (превод уживо)", bs: "Poruke sa kupcima (prevod uživo)", hr: "Poruke s kupcima (prijevod uživo)", uk: "Спілкування з покупцями (живий переклад)", sq: "Mesazhe me blerësit (përkthim i drejtpërdrejtë)", el: "Επικοινωνία με αγοραστές (ζωντανή μετάφραση)", tr: "Alıcılarla mesajlaşma (canlı çeviri)", es: "Mensajería con compradores (traducción en directo)" },
            { hu: "Megtekintés-statisztika", me: "Statistika pregleda", en: "View statistics", ru: "Статистика просмотров", sr: "Статистика прегледа", bs: "Statistika pregleda", hr: "Statistika pregleda", uk: "Статистика переглядів", sq: "Statistika shikimesh", el: "Στατιστικά προβολών", tr: "Görüntülenme istatistikleri", es: "Estadísticas de visitas" }
          ].map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-ink-700">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Icon name="check" size={13} strokeWidth={3} />
              </span>
              {L(f, lang)}
            </li>
          ))}
        </ul>
      </div>

      {/* Kiemelés (opcionális) */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-400">{tr("pricing_boost_title", lang)}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {boosts.map((b) => (
            <div
              key={b.key}
              className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-soft ${
                b.best ? "border-2 border-ink-950" : "border-ink-100"
              }`}
            >
              {b.best && (
                <span className="absolute -top-3 left-6 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-3 py-0.5 text-[10px] font-black uppercase text-ink-950">
                  {L(b.sub, lang)}
                </span>
              )}
              <div className="flex items-center gap-2 text-ink-900">
                <Icon name="sparkles" size={18} className="text-brand-500" />
                <span className="font-black">{tr(b.key, lang)}</span>
              </div>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-black tracking-tight text-ink-900">{formatPrice(b.price, lang)}</span>
                <span className="pb-1 text-sm font-semibold text-ink-400">{tr("pricing_per_listing", lang)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-400">{L(b.sub, lang)}</p>
              <button
                onClick={() => toast(tr("pricing_soon_toast", lang), "info")}
                className={`mt-5 rounded-2xl py-3 text-sm font-bold transition ${
                  b.best
                    ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow hover:from-brand-600 hover:to-brand-700"
                    : "border border-ink-200 text-ink-800 hover:border-ink-900 hover:bg-ink-50"
                }`}
              >
                {tr("pricing_choose", lang)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Irodai upsell */}
      <div className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-ink-50/70 p-4">
        <Icon name="building" size={20} className="mt-0.5 shrink-0 text-brand-500" />
        <p className="text-sm text-ink-700">{tr("pricing_want_agency", lang)}</p>
      </div>
    </div>
  );
}
