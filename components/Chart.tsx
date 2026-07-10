"use client";

export interface ChartPoint {
  label: string;
  value: number;
}

// Lightweight responsive SVG area+line chart — no external charting dependency.
export default function Chart({
  data,
  format,
  height = 200
}: {
  data: ChartPoint[];
  format?: (v: number) => string;
  height?: number;
}) {
  const W = 600;
  const H = height;
  const padX = 8;
  const padTop = 16;
  const padBottom = 26;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  // Pad the vertical range so the line doesn't touch the edges.
  const lo = min - range * 0.15;
  const hi = max + range * 0.15;

  const x = (i: number) => padX + (i * (W - 2 * padX)) / Math.max(1, data.length - 1);
  const y = (v: number) => padTop + (1 - (v - lo) / (hi - lo)) * (H - padTop - padBottom);

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");
  const areaPath = `${linePath} L ${x(data.length - 1)} ${H - padBottom} L ${x(0)} ${H - padBottom} Z`;

  const last = data[data.length - 1];
  const fmt = format ?? ((v: number) => String(Math.round(v)));

  // Show at most ~6 x labels to avoid crowding.
  const labelStep = Math.ceil(data.length / 6);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5b3" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0ea5b3" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="#0ea5b3" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {data.map((d, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(d.value)}
            r={i === data.length - 1 ? 4.5 : 2.5}
            fill={i === data.length - 1 ? "#0ea5b3" : "#fff"}
            stroke="#0ea5b3"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-1 text-[10px] text-ink-400">
        {data.map((d, i) =>
          i % labelStep === 0 || i === data.length - 1 ? <span key={i}>{d.label}</span> : null
        )}
      </div>

      <div className="mt-1 flex justify-between text-xs text-ink-500">
        <span>
          {fmt(min)} – {fmt(max)}
        </span>
        <span className="font-semibold text-brand-700">{fmt(last.value)}</span>
      </div>
    </div>
  );
}
