import type { Metadata } from "next";
import { Suspense } from "react";
import BlogEditor from "@/components/owner/BlogEditor";

export const metadata: Metadata = {
  title: "Cikkek — Tulajdonosi konzol",
  robots: { index: false, follow: false }
};

export default function OwnerBlogPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-400">Betöltés…</div>}>
      <BlogEditor />
    </Suspense>
  );
}
