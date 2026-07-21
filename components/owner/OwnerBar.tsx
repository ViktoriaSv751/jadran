"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/store";
import Icon, { type IconName } from "@/components/ui/Icon";

/**
 * Tulajdonosi mód-sáv — CSAK a szoftver tulajdonosának (is_owner), MINDEN oldalon.
 *
 * Ez teszi „rád szabottá" az egész rendszert: bárhol jársz az appban, egy vékony
 * sáv jelzi, hogy tulajdonosként vagy bent, és egy kattintással eléred a konzolt,
 * a cikkírást és a tartalmakat. A látogatók ebből semmit nem látnak.
 */
export default function OwnerBar() {
  const { user, ready } = useAuth();
  const pathname = usePathname();

  if (!ready || !user?.isOwner) return null;
  // A fókuszált, teljes-magasságú nézetekben (hirdetésfeltöltő, üzenetek) ne lógjon be.
  if (pathname === "/listings/new" || pathname === "/messages") return null;

  const firstName = (user.name || "Tulajdonos").split(" ")[0];

  return (
    <div className="sticky top-0 z-[60] border-b-2 border-ink-950 bg-ink-950 text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-1.5 text-sm">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-[#c8ff00] text-ink-950">
            <Icon name="sliders" size={12} strokeWidth={2.6} />
          </span>
          <span className="hidden sm:inline">Tulajdonosi mód</span>
          <span className="text-white/60">· {firstName}</span>
        </span>

        <nav className="ml-auto flex items-center gap-1">
          <BarLink href="/owner" icon="home" label="Konzol" active={pathname === "/owner"} />
          <BarLink href="/owner/blog" icon="plus" label="Új cikk" active={pathname.startsWith("/owner/blog")} />
          <BarLink href="/tudastar" icon="compass" label="Tudástár" active={pathname.startsWith("/tudastar")} />
        </nav>
      </div>
    </div>
  );
}

function BarLink({ href, icon, label, active }: { href: string; icon: IconName; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
        active ? "bg-[#c8ff00] text-ink-950" : "text-white/85 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon name={icon} size={13} strokeWidth={2.4} />
      <span>{label}</span>
    </Link>
  );
}
