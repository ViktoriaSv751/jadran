import type { Metadata } from "next";
import MarketClient from "@/components/market/MarketClient";

export const metadata: Metadata = {
  title: "Piactér — árak, trendek, hozamok",
  description:
    "Montenegrói ingatlanpiaci intelligencia: €/m² árak és trendek városonként, kínálat, becsült bérleti hozamok és árcsökkentés-követő."
};

export default function MarketPage() {
  return <MarketClient />;
}
