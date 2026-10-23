import type { Geometry } from "../src/types/data";
// Regular grid is conceptual architecture, never passed off as physical PE coordinates.
export const architectureGeometry: Geometry = {
  die: [8000, 8000],
  origin: [0, 0],
  kind: "DEMO",
  source:
    "Conceptual 32×32 systolic PE grid; RTL: PE_array.v / PE_row.v / PE.v",
  unresolvedMasters: [],
  macros: Array.from({ length: 1024 }, (_, i) => ({
    id: `conceptual.row[${Math.floor(i / 32)}].pe[${i % 32}]`,
    name: `PE ${Math.floor(i / 32)},${i % 32}`,
    type: "pe",
    master: "ProcessingElement",
    x: 500 + (i % 32) * 218,
    y: 500 + (31 - Math.floor(i / 32)) * 218,
    w: 188,
    h: 188,
    orientation: "N",
    rtl: "rtl_asic/PE.v",
    source: "Conceptual grid only; no extracted internal geometry",
  })),
};
