import { describe, it, expect } from "vitest";
import { messages } from "../src/i18n/dictionaries";
import {
  validateGeometry,
  validateWaveform,
  csvEncode,
} from "../src/data-adapters/project";
import { valueAt } from "../src/waveforms/WaveformViewer";
import project from "../public/generated-data/project.json";
describe("evidence integrity and import boundaries", () => {
  it("contains exactly 32 row, 80 SRAM and one AXI macro inside the declared die", () => {
    const g = validateGeometry(project.floorplan);
    expect(g.macros.filter((m) => m.type === "row")).toHaveLength(32);
    expect(g.macros.filter((m) => m.type === "sram")).toHaveLength(80);
    expect(g.macros.filter((m) => m.type === "axi")).toHaveLength(1);
    for (const m of g.macros) {
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.y).toBeGreaterThanOrEqual(0);
      expect(m.x + m.w).toBeLessThanOrEqual(g.die[0] + 0.01);
      expect(m.y + m.h).toBeLessThanOrEqual(g.die[1] + 0.01);
    }
  });
  it("does not manufacture absent physical / waveform files or identify an unknown commit", () => {
    expect(project.availability.def).toEqual([]);
    expect(project.availability.gds).toEqual([]);
    expect(project.availability.vcd).toEqual([]);
    expect(project.version.commit).toBeNull();
    expect(project.signoff.frequencyMHz).toBe(50);
    expect(project.floorplan.kind).toBe("RECONSTRUCTED");
  });
  it("rejects malformed geometry and waveform events", () => {
    expect(() => validateGeometry({ die: [-1, 2], macros: [] })).toThrow();
    expect(() =>
      validateWaveform({
        end: 2,
        source: "x",
        signals: [
          {
            name: "a",
            width: 1,
            events: [
              [2, "1"],
              [1, "0"],
            ],
          },
        ],
      }),
    ).toThrow();
  });
  it("exports quoted CSV correctly", () =>
    expect(csvEncode([{ name: "a,b", value: '"quoted"\nline' }])).toBe(
      '"name","value"\r\n"a,b","""quoted""\nline"',
    ));
  it("time cursor selects latest transition without inventing initial data", () => {
    const events: [number, string][] = [
      [10, "0"],
      [20, "1"],
      [40, "x"],
    ];
    expect(valueAt(events, 0)).toBe("x");
    expect(valueAt(events, 20)).toBe("1");
    expect(valueAt(events, 39)).toBe("1");
    expect(valueAt(events, 40)).toBe("x");
  });
});
describe("bilingual dictionaries", () => {
  it("every key has nonempty English and Vietnamese translations", () => {
    for (const [key, values] of Object.entries(messages)) {
      expect(values, key).toHaveLength(2);
      expect(values[0].trim(), key).not.toBe("");
      expect(values[1].trim(), key).not.toBe("");
    }
  });
});
