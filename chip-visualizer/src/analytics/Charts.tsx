import { useI18n } from "../i18n/I18n";
export function Bars({
  items,
  max,
  unit = "",
}: {
  items: { label: string; value: number; color?: string }[];
  max?: number;
  unit?: string;
}) {
  const { t } = useI18n();
  const limit = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="bars">
      {items.map((item, i) => (
        <div className="bar-row" key={i}>
          <div className="bar-label">
            <span>{item.label}</span>
            <strong>
              {Number.isFinite(item.value)
                ? item.value.toLocaleString(undefined, {
                    maximumFractionDigits: 3,
                  })
                : t("unavailable")}{" "}
              <small>{unit}</small>
            </strong>
          </div>
          <div className="bar-track">
            <div
              style={{
                width: `${Math.max(0, Math.min(100, (item.value / limit) * 100))}%`,
                background: item.color ?? "var(--accent)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
export function LineChart({
  values,
  labels,
  yLabel,
  color = "#57cdbf",
  selected,
}: {
  values: number[];
  labels: string[];
  yLabel: string;
  color?: string;
  selected?: number;
}) {
  const max = Math.max(...values, 1),
    width = 650,
    height = 230;
  const point = (v: number, i: number) => [
    55 + (i * (width - 80)) / Math.max(1, values.length - 1),
    height - 38 - (v / max) * (height - 70),
  ];
  const points = values.map((v, i) => point(v, i));
  return (
    <svg
      className="chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={yLabel}
    >
      <text x="8" y="15" className="chart-label">
        {yLabel}
      </text>
      {[0, 0.25, 0.5, 0.75, 1].map((r) => (
        <g key={r}>
          <line
            x1="55"
            x2={width - 20}
            y1={height - 38 - r * (height - 70)}
            y2={height - 38 - r * (height - 70)}
            className="chart-grid"
          />
          <text
            x="44"
            y={height - 34 - r * (height - 70)}
            textAnchor="end"
            className="chart-label"
          >
            {Math.round(max * r)}
          </text>
        </g>
      ))}
      <path
        d={`M${points.map((p) => p.join(",")).join(" L")}`}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      />
      {points.map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r={selected === i ? 6 : 3.5}
            fill={selected === i ? "#edbc70" : color}
          />
          <text
            x={x}
            y={height - 13}
            textAnchor="middle"
            className="chart-label"
          >
            {labels[i]}
          </text>
          <title>
            {labels[i]}: {values[i]}
          </title>
        </g>
      ))}
    </svg>
  );
}
export function Histogram({
  bins,
  label,
}: {
  bins: { x: number; value: number }[];
  label: string;
}) {
  const max = Math.max(...bins.map((b) => b.value), 1),
    minX = Math.min(...bins.map((b) => b.x), 0),
    maxX = Math.max(...bins.map((b) => b.x), 1);
  return (
    <svg className="chart" viewBox="0 0 660 240" role="img" aria-label={label}>
      <text x="10" y="16" className="chart-label">
        {label}
      </text>
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line
            x1="50"
            x2="640"
            y1={205 - v * 165}
            y2={205 - v * 165}
            className="chart-grid"
          />
          <text
            x="42"
            y={209 - v * 165}
            textAnchor="end"
            className="chart-label"
          >
            {Math.round(max * v)}
          </text>
        </g>
      ))}
      {bins.map((b, i) => (
        <rect
          key={i}
          x={50 + ((b.x - minX) / (maxX - minX + 0.1)) * 585}
          y={205 - (b.value / max) * 165}
          width={Math.max(1, (585 / bins.length) * 0.8)}
          height={Math.max(1, (b.value / max) * 165)}
          fill={b.x < 0 ? "#eb7b7b" : "#58c7b9"}
        >
          <title>
            {b.x.toFixed(1)} ns: {b.value}
          </title>
        </rect>
      ))}
      {[minX, (maxX + minX) / 2, maxX].map((v) => (
        <text
          key={v}
          x={50 + ((v - minX) / (maxX - minX + 0.1)) * 585}
          y="226"
          textAnchor="middle"
          className="chart-label"
        >
          {v.toFixed(1)} ns
        </text>
      ))}
    </svg>
  );
}
