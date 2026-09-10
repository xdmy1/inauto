"use client";

// Dual-thumb range slider — two overlaid native inputs, custom track + fill
export function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const [a, b] = value;
  const pct = (v: number) => ((v - min) / Math.max(1, max - min)) * 100;

  return (
    <div className="range-wrap">
      <div className="range-track" />
      <div
        className="range-fill"
        style={{ left: `${pct(a)}%`, width: `${pct(b) - pct(a)}%` }}
      />
      <input
        type="range"
        className="range-input"
        min={min}
        max={max}
        step={step}
        value={a}
        aria-label="min"
        onChange={(e) =>
          onChange([Math.min(Number(e.target.value), b - step), b])
        }
      />
      <input
        type="range"
        className="range-input"
        min={min}
        max={max}
        step={step}
        value={b}
        aria-label="max"
        onChange={(e) =>
          onChange([a, Math.max(Number(e.target.value), a + step)])
        }
      />
    </div>
  );
}

// single-thumb variant (e.g. "mileage up to")
export function MaxSlider({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / Math.max(1, max - min)) * 100;
  return (
    <div className="range-wrap">
      <div className="range-track" />
      <div className="range-fill" style={{ left: 0, width: `${pct}%` }} />
      <input
        type="range"
        className="range-input"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label="max"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
