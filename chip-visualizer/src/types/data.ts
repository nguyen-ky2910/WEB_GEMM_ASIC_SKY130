export type Row = Record<string, string>;
export interface Table {
  source: string;
  rows: Row[];
}
export interface Macro {
  id: string;
  name: string;
  type: string;
  master: string;
  x: number;
  y: number;
  w: number;
  h: number;
  orientation: string;
  rtl: string | null;
  source: string;
}
export interface Geometry {
  die: [number, number];
  origin: [number, number];
  macros: Macro[];
  kind: string;
  source: string;
  unresolvedMasters: string[];
}
export interface Signal {
  name: string;
  width: number;
  events: [number, string][];
}
export interface Waveform {
  signals: Signal[];
  end: number;
  timescale: string;
  truncated: boolean;
  source: string;
  kind: string;
}
export interface Project {
  schemaVersion: number;
  version: { branch: string | null; commit: string | null; note: string };
  inventory: { path: string; size: number; sha256: string }[];
  modules: { name: string; source: string; signals: string[] }[];
  tables: Record<string, Table>;
  floorplan: Geometry;
  runs: {
    run: string;
    change: string;
    result: string;
    source: string;
    evidence: string;
  }[];
  trace: {
    source: string;
    kind: string;
    timescale: string;
    rows: Record<string, number>[];
  };
  signoff: {
    source: string;
    evidence: string;
    run: string;
    date: string;
    frequencyMHz: number;
    setupTT: number;
    holdTT: number;
    holdFF: number;
    holdSS: number;
    setupSS: number;
    drt: number;
    magic: number;
    antenna: number;
    lvs: string;
    xor: number;
    gls: string;
    ioHoldSS: number;
    sramClockSlewTT: number;
  };
  availability: Record<string, string[]>;
}
export type Page =
  | "overview"
  | "explorer"
  | "architecture"
  | "gemm"
  | "axi"
  | "flow"
  | "eco"
  | "waveform"
  | "timing"
  | "power"
  | "area"
  | "integrity"
  | "verification"
  | "comparison"
  | "sources";
