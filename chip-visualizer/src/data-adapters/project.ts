import type { Geometry, Project, Waveform, Row } from "../types/data";
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const evidenceUrl = (path: string) => asset(`evidence/${path}`);
export async function loadProject(): Promise<Project> {
  const response = await fetch(asset("generated-data/project.json"));
  if (!response.ok) throw new Error(`Dataset HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (
    !data ||
    typeof data !== "object" ||
    !("schemaVersion" in data) ||
    data.schemaVersion !== 1
  )
    throw new Error("Unsupported dataset schema");
  return data as Project;
}
export function validateGeometry(value: unknown): Geometry {
  if (!value || typeof value !== "object") throw new Error("Invalid geometry");
  const g = value as Geometry;
  if (
    !Array.isArray(g.die) ||
    g.die.length !== 2 ||
    !g.die.every((n) => Number.isFinite(n) && n > 0 && n < 1e7) ||
    !Array.isArray(g.macros) ||
    g.macros.length > 20000 ||
    typeof g.source !== "string" ||
    !["REAL DATA", "RECONSTRUCTED", "DEMO"].includes(g.kind)
  )
    throw new Error("Invalid extents");
  const ids = new Set<string>();
  for (const m of g.macros) {
    if (
      typeof m.id !== "string" ||
      ids.has(m.id) ||
      typeof m.name !== "string" ||
      typeof m.type !== "string" ||
      ![m.x, m.y, m.w, m.h].every(Number.isFinite) ||
      m.w <= 0 ||
      m.h <= 0
    )
      throw new Error("Invalid macro");
    ids.add(m.id);
  }
  if (!Array.isArray(g.origin) || !g.origin.every(Number.isFinite))
    g.origin = [0, 0];
  g.unresolvedMasters ??= [];
  return g;
}
export function validateWaveform(value: unknown): Waveform {
  if (!value || typeof value !== "object") throw new Error("Invalid waveform");
  const w = value as Waveform;
  if (
    !Array.isArray(w.signals) ||
    w.signals.length > 10000 ||
    !Number.isFinite(w.end) ||
    w.end < 0 ||
    typeof w.source !== "string" ||
    typeof w.timescale !== "string" ||
    !["REAL DATA", "REPLAY", "DEMO"].includes(w.kind)
  )
    throw new Error("Invalid waveform");
  for (const s of w.signals) {
    if (
      typeof s.name !== "string" ||
      !Number.isInteger(s.width) ||
      s.width < 1 ||
      !Array.isArray(s.events) ||
      s.events.length > 100000
    )
      throw new Error("Invalid signal");
    let last = -1;
    for (const e of s.events) {
      if (
        !Array.isArray(e) ||
        e.length !== 2 ||
        !Number.isFinite(e[0]) ||
        e[0] < last ||
        typeof e[1] !== "string" ||
        !/^[01xz]+$/i.test(e[1])
      )
        throw new Error("Invalid events");
      last = e[0];
    }
  }
  return w;
}
export function metricMap(project: Project, table: string) {
  return Object.fromEntries(
    (project.tables[table]?.rows ?? []).map((r) => [r.metric, r.value]),
  );
}
export function csvEncode(rows: Row[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    keys.map(escape).join(","),
    ...rows.map((r) => keys.map((k) => escape(r[k])).join(",")),
  ].join("\r\n");
}
export function downloadText(
  text: string,
  name: string,
  type = "text/csv;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob(["\ufeff", text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
