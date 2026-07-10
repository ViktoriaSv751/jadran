import Link from "next/link";
import Icon, { type IconName } from "./ui/Icon";

export default function EmptyState({
  icon = "search",
  title,
  hint,
  action
}: {
  icon?: IconName;
  title: string;
  hint?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="animate-fade-in rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-ink-50 text-ink-500">
        <Icon name={icon} size={28} />
      </div>
      <p className="text-base font-semibold text-ink-800">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{hint}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
