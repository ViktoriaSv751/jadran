import type { IconName } from "@/components/ui/Icon";

/** Ingatlantípus → vonalikon. Egy helyen, hogy minden felület ugyanazt használja. */
export const TYPE_ICONS: Record<string, IconName> = {
  apartment: "building",
  house: "home",
  villa: "villa",
  new: "sparkles",
  land: "plot",
  commercial: "store",
  office: "briefcase",
  hospitality: "bed",
  institution: "landmark",
  garage: "warehouse",
  industrial: "factory",
  agricultural: "sprout"
};
