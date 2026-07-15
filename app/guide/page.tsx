"use client";

import { useState } from "react";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import PageHeading from "@/components/ui/PageHeading";

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
  },
  {
    title: { hu: "4. Adó és tulajdonátruházás", me: "4. Porez i prenos", en: "4. Tax & transfer", ru: "4. Налог и передача", sr: "4. Порез и пренос", bs: "4. Porez i prenos", hr: "4. Porez i prijenos", uk: "4. Податок і передача", sq: "4. Taksa dhe transferimi", el: "4. Φόρος & μεταβίβαση", tr: "4. Vergi ve devir", es: "4. Impuesto y transmisión" },
    body: { hu: "Az átírási illeték 3%. A tulajdonjog bejegyzése a kataszterbe a fizetés után történik.", me: "Porez na prenos 3%. Upis vlasništva u katastar nakon plaćanja.", en: "Transfer tax 3%. Registration of ownership in the cadastre after payment.", ru: "Налог на передачу 3%. Регистрация права в кадастре после оплаты.", sr: "Порез на пренос 3%. Упис власништва у катастар након плаћања.", bs: "Porez na prenos 3%. Upis vlasništva u katastar nakon plaćanja.", hr: "Porez na prijenos 3 %. Upis vlasništva u katastar nakon plaćanja.", uk: "Податок на передачу 3%. Реєстрація права власності в кадастрі після сплати.", sq: "Taksa e transferimit 3%. Regjistrimi i pronësisë në kadastër pas pagesës.", el: "Φόρος μεταβίβασης 3%. Καταχώριση της ιδιοκτησίας στο κτηματολόγιο μετά την πληρωμή.", tr: "Devir vergisi %3. Ödemeden sonra mülkiyetin kadastroya tescili.", es: "Impuesto de transmisión del 3%. Inscripción de la propiedad en el catastro tras el pago." }
  }
];

const FOREIGN_TITLE: GL = { hu: "Külföldi vásárlóknak", me: "Za strane kupce", en: "For foreign buyers", ru: "Для иностранных покупателей", sr: "За стране купце", bs: "Za strane kupce", hr: "Za strane kupce", uk: "Для іноземних покупців", sq: "Për blerësit e huaj", el: "Για ξένους αγοραστές", tr: "Yabancı alıcılar için", es: "Para compradores extranjeros" };

const foreignTrack: GL[] = [
  { hu: "Külföldiek korlátozás nélkül vásárolhatnak lakást/házat; mezőgazdasági földet cégen keresztül.", me: "Stranci mogu kupiti stan/kuću bez ograničenja; poljoprivredno zemljište preko firme.", en: "Foreigners can buy apartments/houses freely; agricultural land via a company.", ru: "Иностранцы могут свободно покупать квартиры/дома; сельхозземлю — через компанию.", sr: "Странци могу купити стан/кућу без ограничења; пољопривредно земљиште преко фирме.", bs: "Stranci mogu slobodno kupiti stan/kuću; poljoprivredno zemljište preko firme.", hr: "Stranci mogu slobodno kupiti stan/kuću; poljoprivredno zemljište preko tvrtke.", uk: "Іноземці можуть вільно купувати квартири/будинки; сільськогосподарську землю — через компанію.", sq: "Të huajt mund të blejnë lirisht apartamente/shtëpi; tokë bujqësore përmes një kompanie.", el: "Οι ξένοι μπορούν να αγοράζουν διαμερίσματα/κατοικίες ελεύθερα· αγροτική γη μέσω εταιρείας.", tr: "Yabancılar daire/ev satın alabilir; tarım arazisini ise bir şirket üzerinden.", es: "Los extranjeros pueden comprar pisos/casas sin restricciones; suelo agrícola a través de una sociedad." },
  { hu: "Tartózkodáshoz fontold meg a cégalapítást vagy a tartózkodási engedélyt.", me: "Za boravak razmislite o registraciji firme ili dozvoli boravka.", en: "For residency, consider company registration or a residence permit.", ru: "Для ВНЖ рассмотрите регистрацию компании или вид на жительство.", sr: "За боравак размислите о регистрацији фирме или дозволи боравка.", bs: "Za boravak razmislite o registraciji firme ili dozvoli boravka.", hr: "Za boravak razmislite o registraciji tvrtke ili dozvoli boravka.", uk: "Для проживання розгляньте реєстрацію компанії або дозвіл на проживання.", sq: "Për qëndrim, merr në konsideratë regjistrimin e një kompanie ose një leje qëndrimi.", el: "Για διαμονή, εξετάστε την εγγραφή εταιρείας ή μια άδεια διαμονής.", tr: "Oturum için şirket kaydını veya oturma iznini değerlendirin.", es: "Para residir, considera la constitución de una sociedad o un permiso de residencia." },
  { hu: "Nyiss helyi bankszámlát a fizetéshez és a rezsihez.", me: "Otvorite lokalni bankovni račun za plaćanje i komunalije.", en: "Open a local bank account for payment and utilities.", ru: "Откройте местный банковский счёт для оплаты и коммунальных услуг.", sr: "Отворите локални банковни рачун за плаћање и комуналије.", bs: "Otvorite lokalni bankovni račun za plaćanja i komunalije.", hr: "Otvorite lokalni bankovni račun za plaćanje i komunalne usluge.", uk: "Відкрийте місцевий банківський рахунок для оплати та комунальних послуг.", sq: "Hap një llogari bankare lokale për pagesat dhe shërbimet komunale.", el: "Ανοίξτε έναν τοπικό τραπεζικό λογαριασμό για πληρωμές και λογαριασμούς κοινής ωφέλειας.", tr: "Ödeme ve faturalar için yerel bir banka hesabı açın.", es: "Abre una cuenta bancaria local para los pagos y los suministros." }
];

export default function GuidePage() {
  const { lang } = useLang();
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeading icon="compass">{tr("guide_title", lang)}</PageHeading>

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
      </div>

      <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <h2 className="font-bold text-brand-700">{pick(FOREIGN_TITLE, lang)}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-600">
          {foreignTrack.map((p, i) => (
            <li key={i}>{pick(p, lang)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
