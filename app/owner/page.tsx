import type { Metadata } from "next";
import OwnerConsole from "@/components/owner/OwnerConsole";

// Privát tulajdonosi konzol — nem indexeljük, és nincs OG-megosztás.
export const metadata: Metadata = {
  title: "Tulajdonosi vezérlőpult",
  robots: { index: false, follow: false }
};

export default function OwnerPage() {
  return <OwnerConsole />;
}
