"use client";

import Link from "next/link";
import { useAuth } from "@/lib/store";
import Icon from "@/components/ui/Icon";

/**
 * Owner-only „Szerkesztés" gomb egy konkrét blogcikkhez. A látogatók nem látják.
 * A szerkesztőt a `?edit=<id>` paraméterrel közvetlenül a cikkre nyitja.
 */
export default function OwnerEditLink({ postId }: { postId: string }) {
  const { user, ready } = useAuth();
  if (!ready || !user?.isOwner) return null;

  return (
    <Link
      href={`/owner/blog?edit=${postId}`}
      className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-3.5 py-1.5 text-xs font-bold text-ink-950 transition hover:brightness-95"
    >
      <Icon name="sliders" size={14} strokeWidth={2.4} />
      Cikk szerkesztése
    </Link>
  );
}
