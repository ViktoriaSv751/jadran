import { Suspense } from "react";
import SearchClient from "@/components/SearchClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">…</div>}>
      <SearchClient />
    </Suspense>
  );
}
