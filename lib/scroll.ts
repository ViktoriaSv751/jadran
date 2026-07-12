/**
 * Egy elem tetejére ugrik (a sticky fejléc `offset`-jével). Közvetlen
 * `scrollTo`-t használ (nem natív „smooth", ami egyes környezetekben nem indul
 * el megbízhatóan) — a szekció-ugró navigációhoz ez a stabil megoldás.
 */
export function smoothScrollToId(id: string, offset = 56): void {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  const target = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
  // AZONNALI ugrás — megbízható minden környezetben (a natív „smooth" itt néha
  // nem indul el). A felhasználó „ugrást" kért a szekciók közt.
  window.scrollTo(0, target);
}
