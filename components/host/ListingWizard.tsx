"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useLang, useListing } from "@/lib/store";
import {
  tr,
  loc,
  typeLabels,
  conditionLabels,
  viewLabels,
  modeLabels,
  amenityLabels,
  heatingLabels
} from "@/lib/i18n";
import { cities, montenegroPlaces } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import * as db from "@/lib/db";
import { toast } from "@/lib/ui";
import { extractSmart } from "@/lib/import/ai-extract-remote";
import type {
  Amenity,
  Condition,
  Listing,
  ListingMode,
  LocalizedText,
  PropertyType,
  ViewType
} from "@/lib/types";
import Button from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import Photo from "@/components/Photo";
import ImageUploader from "@/components/host/ImageUploader";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/** Közelítő koordináták településenként — az új hirdetés térképi elhelyezéséhez.
 *  Mind a 25 község + a fő parti települések, hogy ne essen minden Budvára. */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Budva: { lat: 42.2864, lng: 18.84 },
  Tivat: { lat: 42.4347, lng: 18.6963 },
  Kotor: { lat: 42.4247, lng: 18.7712 },
  "Herceg Novi": { lat: 42.4531, lng: 18.5375 },
  Bar: { lat: 42.0931, lng: 19.1003 },
  Podgorica: { lat: 42.441, lng: 19.2627 },
  Ulcinj: { lat: 41.9294, lng: 19.2244 },
  Nikšić: { lat: 42.7731, lng: 18.9483 },
  Cetinje: { lat: 42.3906, lng: 18.9116 },
  Pljevlja: { lat: 43.357, lng: 19.3583 },
  "Bijelo Polje": { lat: 43.0383, lng: 19.7475 },
  Berane: { lat: 42.8425, lng: 19.8719 },
  Rožaje: { lat: 42.8408, lng: 20.1664 },
  Danilovgrad: { lat: 42.5539, lng: 19.1058 },
  Kolašin: { lat: 42.8231, lng: 19.5175 },
  Mojkovac: { lat: 42.9603, lng: 19.5831 },
  Plav: { lat: 42.5964, lng: 19.9439 },
  Žabljak: { lat: 43.155, lng: 19.1225 },
  Andrijevica: { lat: 42.7339, lng: 19.7906 },
  Plužine: { lat: 43.1531, lng: 18.8433 },
  Šavnik: { lat: 42.9569, lng: 19.0967 },
  Gusinje: { lat: 42.5619, lng: 19.8331 },
  Petnjica: { lat: 42.9106, lng: 19.9628 },
  Tuzi: { lat: 42.365, lng: 19.3311 },
  Sutomore: { lat: 42.1417, lng: 19.0483 },
  Petrovac: { lat: 42.205, lng: 18.9439 },
  "Sveti Stefan": { lat: 42.2578, lng: 18.8917 },
  Bečići: { lat: 42.2778, lng: 18.8639 },
  Dobrota: { lat: 42.442, lng: 18.764 },
  Perast: { lat: 42.4869, lng: 18.6989 },
  Risan: { lat: 42.5142, lng: 18.6947 },
  Igalo: { lat: 42.4569, lng: 18.51 },
  Bijela: { lat: 42.4553, lng: 18.6217 }
};

const TYPES: PropertyType[] = [
  "apartment",
  "house",
  "villa",
  "new",
  "land",
  "commercial",
  "office",
  "hospitality",
  "institution",
  "garage",
  "industrial",
  "agricultural"
];
const CONDITIONS: Condition[] = ["new", "renovated", "good", "needs_work"];
const VIEWS: ViewType[] = ["sea", "mountain", "city"];
const HEATINGS = Object.keys(heatingLabels);
const AMENITIES = Object.keys(amenityLabels) as Amenity[];
const STEPS = ["wizard_basics", "wizard_details", "wizard_photos", "wizard_pricing", "wizard_preview"] as const;
const STEP_ICONS = ["home", "sliders", "eye", "euro", "check"] as const;

interface FormState {
  mode: ListingMode;
  type: PropertyType;
  title: string;
  description: string;
  city: string;
  district: string;
  area: string;
  rooms: string;
  floor: string;
  year: string;
  condition: Condition;
  view: ViewType;
  energy: string;
  distanceToSea: string;
  furnished: boolean;
  amenities: Amenity[];
  images: string;
  price: string;
  // sale-only
  plotArea: string;
  monthlyCommonCost: string;
  heatingType: string;
  // rent-only
  deposit: string;
  minTermMonths: string;
  availableFrom: string;
  utilitiesIncluded: boolean;
  petsAllowed: boolean;
}

const emptyForm: FormState = {
  mode: "sale",
  type: "apartment",
  title: "",
  description: "",
  city: cities[0] ?? "Budva",
  district: "",
  area: "",
  rooms: "",
  floor: "",
  year: String(new Date().getFullYear()),
  condition: "good",
  view: "sea",
  energy: "B",
  distanceToSea: "",
  furnished: false,
  amenities: [],
  images: "",
  price: "",
  plotArea: "",
  monthlyCommonCost: "",
  heatingType: "gas",
  deposit: "",
  minTermMonths: "12",
  availableFrom: "",
  utilitiesIncluded: false,
  petsAllowed: false
};

function l10n(text: string): LocalizedText {
  return { hu: text, me: text, en: text, ru: text };
}

export default function ListingWizard() {
  const { lang } = useLang();
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id") ?? undefined;
  const { listing: editing } = useListing(editId ?? "");

  // Seed the form once from the listing being edited (if any).
  const initial = useMemo<FormState>(() => {
    if (!editId || !editing) return emptyForm;
    return {
      mode: editing.mode,
      type: editing.type,
      title: loc(editing.title, lang) || editing.title.hu,
      description: loc(editing.description, lang) || editing.description.hu,
      city: editing.city,
      district: editing.district,
      area: String(editing.area),
      rooms: String(editing.rooms),
      floor: editing.floor === null ? "" : String(editing.floor),
      year: String(editing.year),
      condition: editing.condition,
      view: editing.view,
      energy: editing.energy,
      distanceToSea: String(editing.distanceToSea),
      furnished: editing.furnished,
      amenities: editing.amenities,
      images: editing.images.join("\n"),
      price: String(editing.price),
      plotArea: editing.plotArea != null ? String(editing.plotArea) : "",
      monthlyCommonCost: editing.monthlyCommonCost != null ? String(editing.monthlyCommonCost) : "",
      heatingType: editing.heatingType ?? "gas",
      deposit: editing.deposit != null ? String(editing.deposit) : "",
      minTermMonths: editing.minTermMonths != null ? String(editing.minTermMonths) : "12",
      availableFrom: editing.availableFrom ?? "",
      utilitiesIncluded: editing.utilitiesIncluded ?? false,
      petsAllowed: editing.petsAllowed ?? false
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, editing]);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [seeded, setSeeded] = useState(false);
  const [step, setStep] = useState(0);

  // --- "Varázs-feltöltés": paste free text → AI prefill the form ---
  const [magicText, setMagicText] = useState("");
  const [magicOpen, setMagicOpen] = useState(false);
  const [magicBusy, setMagicBusy] = useState(false);

  const runMagic = async () => {
    if (!magicText.trim() || magicBusy) return;
    setMagicBusy(true);
    const { fields, detected, notes } = await extractSmart(magicText);
    setMagicBusy(false);
    if (detected.length === 0) {
      toast(notes.includes("social-link-only") ? tr("magic_link_note", lang) : tr("magic_empty", lang));
      return;
    }
    setForm((f) => {
      const next = { ...f };
      // Only overwrite with confidently-detected, non-empty values.
      for (const [k, v] of Object.entries(fields)) {
        if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (next as any)[k] = v;
      }
      // If the city was detected but isn't one of our official cities, keep the
      // select valid and stash the detection into district instead.
      if (fields.city && !cities.includes(fields.city)) {
        next.city = f.city;
        if (!next.district) next.district = fields.city;
      }
      return next;
    });
    toast(tr("magic_done", lang).replace("{n}", String(detected.length)));
  };

  // Hydrate from the edited listing as soon as it loads.
  if (editId && editing && !seeded) {
    setForm(initial);
    setSeeded(true);
  }

  if (!user) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleAmenity = (a: Amenity) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a]
    }));

  const isRent = form.mode === "rent";

  // Ha a felhasználó nem tölt fel képet, HELYI mintaképekkel töltjük fel (ezek
  // mindig betöltenek, szemben a külső picsum-mal). Kategóriánként egy-egy.
  const sampleImages = (seed: string): string[] => {
    const pools: [string, number][] = [["ext", 10], ["liv", 7], ["kit", 5], ["bed", 5], ["view", 5]];
    const h = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);
    return pools.map(([cat, max], i) => `/p/${cat}${((h + i) % max) + 1}.jpg`);
  };

  const buildPayload = (): Omit<Listing, "id" | "createdAt" | "views" | "priceHistory"> => {
    // Ismert koordináta a településhez; ha nincs, az ország közepe (Podgorica).
    const coords = CITY_COORDS[form.city] ?? CITY_COORDS.Podgorica;
    const urls = form.images
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      title: l10n(form.title.trim()),
      description: l10n(form.description.trim()),
      type: form.type,
      mode: form.mode,
      status: "active",
      price: Number(form.price) || 0,
      area: Number(form.area) || 0,
      rooms: Number(form.rooms) || 0,
      floor: form.floor === "" ? null : Number(form.floor),
      year: Number(form.year) || new Date().getFullYear(),
      condition: form.condition,
      view: form.view,
      city: form.city,
      district: form.district.trim(),
      distanceToSea: Number(form.distanceToSea) || 0,
      lat: coords.lat,
      lng: coords.lng,
      verification: editing?.verification ?? "none",
      images: urls.length ? urls : sampleImages(user.id + "-" + Date.now().toString(36)),
      amenities: form.amenities,
      ownerId: user.id,
      agency: user.agencyName ?? user.name,
      furnished: form.furnished,
      energy: form.energy.trim() || "B",
      ...(form.mode === "rent"
        ? {
            deposit: form.deposit === "" ? undefined : Number(form.deposit),
            minTermMonths: form.minTermMonths === "" ? undefined : Number(form.minTermMonths),
            availableFrom: form.availableFrom || undefined,
            utilitiesIncluded: form.utilitiesIncluded,
            petsAllowed: form.petsAllowed
          }
        : {
            plotArea: form.plotArea === "" ? undefined : Number(form.plotArea),
            monthlyCommonCost: form.monthlyCommonCost === "" ? undefined : Number(form.monthlyCommonCost),
            heatingType: form.heatingType || undefined
          })
    };
  };

  const canContinue = (): boolean => {
    if (step === 0) return form.title.trim().length > 0 && form.description.trim().length > 0;
    // Csak az alapterület kötelező itt (a kerület és a szobaszám opcionális —
    // pl. telek/üzlethelyiség esetén nincs is szoba). A város előre ki van töltve.
    if (step === 1) return form.area !== "" && Number(form.area) > 0;
    if (step === 3) return form.price !== "" && Number(form.price) > 0;
    return true;
  };

  const submit = () => {
    const payload = buildPayload();
    if (editId && editing) {
      db.updateListing(editId, payload);
      toast(tr("listing_updated_toast", lang));
    } else {
      db.createListing(payload);
      toast(tr("listing_published_toast", lang));
    }
    router.push("/listings");
  };

  const previewImages = (() => {
    const urls = form.images.split("\n").map((s) => s.trim()).filter(Boolean);
    return urls.length ? urls : sampleImages("preview");
  })();

  const progressPct = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <div className="flex items-end justify-between">
        <h1 className="display text-3xl text-ink-900 sm:text-4xl">
          {editId ? tr("edit_listing", lang) : tr("new_listing", lang)}
        </h1>
        <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-bold text-ink-600">
          {step + 1} / {STEPS.length}
        </span>
      </div>

      {/* Step indicator — ikonos, kattintható lépések + kitöltöttség-sáv */}
      <div className="relative mt-6">
        <div className="absolute left-0 right-0 top-5 h-0.5 rounded bg-ink-100" />
        <div
          className="absolute left-0 top-5 h-0.5 rounded bg-brand-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
        <div className="relative flex items-start justify-between">
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <button
                key={s}
                onClick={() => i <= step && setStep(i)}
                disabled={i > step}
                className="flex flex-col items-center gap-1.5 disabled:cursor-not-allowed"
                style={{ width: `${100 / STEPS.length}%` }}
              >
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-full border-2 bg-white transition",
                    current
                      ? "border-ink-900 text-ink-900 shadow-soft"
                      : done
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-ink-200 text-ink-400"
                  )}
                >
                  {done ? <Icon name="check" size={17} strokeWidth={2.6} /> : <Icon name={STEP_ICONS[i]} size={17} />}
                </span>
                <span
                  className={cn(
                    "hidden text-[11px] font-bold sm:block",
                    current ? "text-ink-900" : done ? "text-brand-600" : "text-ink-400"
                  )}
                >
                  {tr(s, lang)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Aktuális lépés fejléce */}
      <div className="mt-5">
        <h2 className="text-lg font-black tracking-tight text-ink-900">{tr(STEPS[step], lang)}</h2>
        <p className="mt-0.5 text-sm text-ink-500">{tr(`${STEPS[step]}_desc`, lang)}</p>
      </div>

      {/* ---- Varázs-feltöltés (AI) — only on the first step of a new listing ---- */}
      {step === 0 && !editId && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white shadow-soft">
          <button
            type="button"
            onClick={() => setMagicOpen((o) => !o)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow">
              <Icon name="sparkles" size={20} strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-ink-900">{tr("magic_title", lang)}</span>
              <span className="block truncate text-xs font-medium text-ink-500">{tr("magic_hint", lang)}</span>
            </span>
            <Icon
              name="chevronDown"
              size={20}
              className={cn("shrink-0 text-ink-400 transition", magicOpen && "rotate-180")}
            />
          </button>
          {magicOpen && (
            <div className="space-y-3 border-t border-brand-100 px-5 pb-5 pt-4">
              <Textarea
                value={magicText}
                onChange={(e) => setMagicText(e.target.value)}
                rows={5}
                placeholder={tr("magic_placeholder", lang)}
              />
              <Button
                onClick={runMagic}
                loading={magicBusy}
                disabled={!magicText.trim()}
                className="w-full sm:w-auto"
              >
                <Icon name="sparkles" size={16} strokeWidth={2.4} className="mr-1.5" />
                {tr("magic_btn", lang)}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
        {/* STEP 0 — Basics */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink-700">{tr("choose_mode", lang)}</span>
              <div className="flex gap-2">
                {(["sale", "rent"] as ListingMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => set("mode", m)}
                    className={cn(
                      "flex-1 rounded-2xl border p-3 text-sm font-semibold transition",
                      form.mode === m
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-ink-200 text-ink-600 hover:border-ink-300"
                    )}
                  >
                    {modeLabels[m][lang]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink-700">{tr("choose_type", lang)}</span>
              {/* Látványos 3D csempék — ugyanúgy, mint a keresőben. */}
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {TYPES.map((tp) => {
                  const activeType = form.type === tp;
                  return (
                    <button
                      key={tp}
                      onClick={() => set("type", tp)}
                      className={cn(
                        "group flex flex-col items-center rounded-2xl border p-2.5 text-center transition",
                        activeType
                          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                          : "border-ink-100 bg-gradient-to-br from-white to-ink-50 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-card"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/cat/${tp}.png`}
                        alt={typeLabels[tp][lang]}
                        loading="lazy"
                        className="h-12 w-12 object-contain transition duration-300 group-hover:scale-110 sm:h-14 sm:w-14"
                      />
                      <span
                        className={cn(
                          "mt-1 text-xs font-bold leading-tight",
                          activeType ? "text-brand-700" : "text-ink-700"
                        )}
                      >
                        {typeLabels[tp][lang]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label={`${tr("title_label", lang)} *`}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={lang === "hu" ? "Pl. Tengerre néző lakás Budva központjában" : ""}
            />
            <Textarea
              label={`${tr("desc_label", lang)} *`}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={5}
            />
          </div>
        )}

        {/* STEP 1 — Details */}
        {step === 1 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Bármely montenegrói település kereshető — nem csak a 6 nagyváros */}
            <div>
              <Input
                label={tr("city", lang)}
                value={form.city}
                list="wizard-places"
                onChange={(e) => set("city", e.target.value)}
              />
              <datalist id="wizard-places">
                {montenegroPlaces.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <Input
              label={tr("district_label", lang)}
              value={form.district}
              onChange={(e) => set("district", e.target.value)}
            />
            <Input
              label={`${tr("area_label", lang)} *`}
              type="number"
              value={form.area}
              onChange={(e) => set("area", e.target.value)}
            />
            <div>
              <Input
                label={tr("rooms_label", lang)}
                type="number"
                value={form.rooms}
                onChange={(e) => set("rooms", e.target.value)}
              />
              {/* Gyors kiválasztás */}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {["1", "2", "3", "4", "5", "6"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set("rooms", r)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      form.rooms === r ? "bg-ink-900 text-white" : "border border-ink-200 text-ink-600 hover:border-ink-400"
                    }`}
                  >
                    {r === "6" ? "6+" : r}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label={tr("floor_label", lang)}
              type="number"
              value={form.floor}
              onChange={(e) => set("floor", e.target.value)}
            />
            <Input
              label={tr("year_label", lang)}
              type="number"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
            />
            <Select
              label={tr("condition", lang)}
              value={form.condition}
              onChange={(e) => set("condition", e.target.value as Condition)}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {conditionLabels[c][lang]}
                </option>
              ))}
            </Select>
            <Select
              label={tr("view", lang)}
              value={form.view}
              onChange={(e) => set("view", e.target.value as ViewType)}
            >
              {VIEWS.map((v) => (
                <option key={v} value={v}>
                  {viewLabels[v][lang]}
                </option>
              ))}
            </Select>
            <Select
              label={tr("energy_label", lang)}
              value={form.energy}
              onChange={(e) => set("energy", e.target.value)}
            >
              <option value="">—</option>
              {["A", "B", "C", "D", "E", "F", "G"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Input
              label={tr("distance_label", lang)}
              type="number"
              value={form.distanceToSea}
              onChange={(e) => set("distanceToSea", e.target.value)}
            />

            {/* ---- SALE-only fields ---- */}
            {!isRent && (
              <>
                <Select
                  label={tr("heating_label", lang)}
                  value={form.heatingType}
                  onChange={(e) => set("heatingType", e.target.value)}
                >
                  {HEATINGS.map((h) => (
                    <option key={h} value={h}>
                      {heatingLabels[h][lang]}
                    </option>
                  ))}
                </Select>
                {(form.type === "house" || form.type === "villa" || form.type === "land") && (
                  <Input
                    label={`${tr("plot_area_label", lang)} (m²)`}
                    type="number"
                    value={form.plotArea}
                    onChange={(e) => set("plotArea", e.target.value)}
                  />
                )}
                {(form.type === "apartment" || form.type === "new") && (
                  <Input
                    label={`${tr("common_cost_label", lang)} (€${tr("per_month_short", lang)})`}
                    type="number"
                    value={form.monthlyCommonCost}
                    onChange={(e) => set("monthlyCommonCost", e.target.value)}
                  />
                )}
              </>
            )}

            {/* ---- RENT-only fields ---- */}
            {isRent && (
              <>
                <Input
                  label={`${tr("deposit_label", lang)} (€)`}
                  type="number"
                  value={form.deposit}
                  onChange={(e) => set("deposit", e.target.value)}
                />
                <Input
                  label={`${tr("min_term_label", lang)} (${tr("months_short", lang)})`}
                  type="number"
                  value={form.minTermMonths}
                  onChange={(e) => set("minTermMonths", e.target.value)}
                />
                <Input
                  label={tr("available_from_label", lang)}
                  type="date"
                  value={form.availableFrom}
                  onChange={(e) => set("availableFrom", e.target.value)}
                />
                <label className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.utilitiesIncluded}
                    onChange={(e) => set("utilitiesIncluded", e.target.checked)}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-200"
                  />
                  <span className="text-sm font-medium text-ink-700">{tr("utilities_included", lang)}</span>
                </label>
                <label className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.petsAllowed}
                    onChange={(e) => set("petsAllowed", e.target.checked)}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-200"
                  />
                  <span className="text-sm font-medium text-ink-700">{tr("pets_allowed", lang)}</span>
                </label>
              </>
            )}

            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.furnished}
                onChange={(e) => set("furnished", e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-200"
              />
              <span className="text-sm font-medium text-ink-700">{tr("furnished", lang)}</span>
            </label>

            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">{tr("amenities_label", lang)}</span>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                      form.amenities.includes(a)
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-ink-200 text-ink-600 hover:border-ink-300"
                    )}
                  >
                    {amenityLabels[a].icon} {amenityLabels[a][lang]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Photos */}
        {step === 2 && (
          <div className="space-y-4">
            <ImageUploader value={form.images} onChange={(v) => set("images", v)} userId={user.id} />
          </div>
        )}

        {/* STEP 3 — Pricing */}
        {step === 3 && (
          <div className="space-y-4">
            <Input
              label={`${isRent ? tr("monthly_rent_label", lang) : tr("price_eur_label", lang)} *`}
              type="number"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
            {form.price !== "" && Number(form.price) > 0 && form.area !== "" && Number(form.area) > 0 && !isRent && (
              <p className="text-sm text-ink-500">
                {formatPrice(Math.round(Number(form.price) / Number(form.area)), lang)}
                {tr("per_m2", lang)}
              </p>
            )}
          </div>
        )}

        {/* STEP 4 — Preview */}
        {step === 4 && (
          <div className="space-y-4">
            <Photo src={previewImages[0]} alt={form.title} className="h-56 w-full rounded-2xl" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                {modeLabels[form.mode][lang]} · {typeLabels[form.type][lang]}
              </span>
              <span className="rounded-md bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                {form.city}
                {form.district ? ` · ${form.district}` : ""}
              </span>
            </div>
            <h2 className="text-xl font-bold text-ink-900">{form.title || "—"}</h2>
            <p className="text-2xl font-black text-ink-900">
              {formatPrice(Number(form.price) || 0, lang)}
              {isRent && <span className="text-base font-semibold text-ink-500">{tr("per_month", lang)}</span>}
            </p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">{form.description || "—"}</p>
            <div className="flex flex-wrap gap-2 text-sm text-ink-600">
              <span>{form.area || 0} m²</span>
              <span>· {form.rooms || 0} {tr("rooms", lang)}</span>
              <span>· {viewLabels[form.view][lang]}</span>
            </div>
            {form.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600">
                    {amenityLabels[a].icon} {amenityLabels[a][lang]}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav buttons — RAGADÓS alsó sáv, mindig látható (a menüsor itt rejtve van). */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-6 flex items-center justify-between gap-3 border-t border-ink-100 bg-white/95 px-4 pt-3 backdrop-blur"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <Button
          variant="ghost"
          size="lg"
          onClick={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
        >
          {step === 0 ? tr("cancel", lang) : tr("prev_step", lang)}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="lg" onClick={() => setStep((s) => s + 1)} disabled={!canContinue()} className="min-w-[9rem]">
            {tr("next_step", lang)}
            <Icon name="arrowRight" size={17} strokeWidth={2.4} className="ml-1.5" />
          </Button>
        ) : (
          <Button variant="accent" size="lg" onClick={submit} className="min-w-[9rem]">
            <Icon name="check" size={17} strokeWidth={2.6} className="mr-1.5" />
            {editId ? tr("save_changes", lang) : tr("publish", lang)}
          </Button>
        )}
      </div>
    </div>
  );
}
