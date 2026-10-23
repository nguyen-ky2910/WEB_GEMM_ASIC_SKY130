import type { ReactNode } from "react";
import { ExternalLink, Download, Info } from "lucide-react";
import { useI18n } from "../i18n/I18n";
import { evidenceUrl, csvEncode, downloadText } from "../data-adapters/project";
import type { Table } from "../types/data";
export function Source({ path }: { path: string }) {
  const { t } = useI18n();
  return (
    <a
      className="source-link"
      href={evidenceUrl(path)}
      target="_blank"
      rel="noreferrer"
      title={path}
    >
      <ExternalLink size={11} />
      {t("source")}: {path}
    </a>
  );
}
export function Badge({
  children,
  tone = "cyan",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge ${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
export function Note({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`note ${tone}`}>
      <Info size={15} />
      <div>{children}</div>
    </div>
  );
}
export function Card({
  title,
  children,
  extra,
  className = "",
}: {
  title?: ReactNode;
  children: ReactNode;
  extra?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-heading">
          <h3>{title}</h3>
          {extra}
        </div>
      )}
      {children}
    </section>
  );
}
export function Export({ table, name }: { table: Table; name: string }) {
  const { t } = useI18n();
  return (
    <button
      className="button subtle small"
      onClick={() => downloadText(csvEncode(table.rows), `${name}.csv`)}
    >
      <Download size={13} />
      {t("download")}
    </button>
  );
}
export function Stat({
  label,
  value,
  unit,
  sub,
  tone = "cyan",
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  sub?: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`stat ${tone}`}>
      <span className="stat-label">{label}</span>
      <div className="stat-value">
        {value}
        <small>{unit}</small>
      </div>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}
export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`toggle-row ${disabled ? "disabled" : ""}`}>
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="switch-track" />
    </label>
  );
}
export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = "",
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <label className="range-control">
      <span>
        {label}
        <output>
          {Number(value.toFixed(2))}
          {unit}
        </output>
      </span>
      <input
        aria-label={typeof label === "string" ? label : undefined}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export function DataTable({
  headers,
  rows,
}: {
  headers: ReactNode[];
  rows: ReactNode[][];
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
