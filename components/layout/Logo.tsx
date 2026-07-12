/**
 * PROOPIFY márkajel — az SVG logó + szómárka. Egy helyen, hogy mindenhol
 * egységes legyen (Header, Footer, egyéb). A `wordmark={false}` csak az ikont adja.
 */
export default function Logo({
  size = 36,
  wordmark = true,
  className = ""
}: {
  size?: number;
  wordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="PROOPIFY" width={size} height={size} className="shrink-0" />
      {wordmark && (
        <span className="text-xl font-black tracking-tight text-ink-900">PROOPIFY</span>
      )}
    </span>
  );
}
