import { describe, it, expect } from "vitest";
import {
  multiply,
  partialProduct,
  quantize,
  validateJob,
} from "../src/simulation/gemm";
import { exampleA, exampleB } from "../demo-data/gemm";
import { initialAxi, tickAxi } from "../src/axi/engine";
import type { AxiConfig } from "../src/axi/engine";
import {
  initialRegisters,
  readRegister,
  registerTick,
} from "../src/axi/registers";
import { advanceAnimation, explodeAt } from "../src/app/settings";
const config: AxiConfig = {
  stall: "manual",
  manualReady: false,
  seed: 123,
  clockGate: true,
  responseReady: true,
  awDelay: 0,
  wDelay: 3,
};
describe("signed INT8 GEMM / RTL-derived quantization", () => {
  it("matches an independently worked rectangular product", () =>
    expect(
      multiply(
        [
          [2, -1, 3],
          [0, 4, -2],
        ],
        [
          [1, 2],
          [3, -1],
          [-2, 1],
        ],
      ),
    ).toEqual([
      [-7, 8],
      [16, -6],
    ]));
  it("every MAC accumulates toward the independent full reference", () => {
    expect(partialProduct(exampleA, exampleB, 0)).toEqual(
      Array.from({ length: 4 }, () => [0, 0, 0, 0]),
    );
    expect(partialProduct(exampleA, exampleB, 64)).toEqual(
      multiply(exampleA, exampleB),
    );
    expect(partialProduct([[2, -1]], [[3], [4]], 1)).toEqual([[6]]);
  });
  it("rounds negative ties toward +infinity and saturates", () => {
    expect(quantize(-3, 1)).toBe(-1);
    expect(quantize(3, 1)).toBe(2);
    expect(quantize(255, 1)).toBe(127);
    expect(quantize(-257, 1)).toBe(-128);
    expect(quantize(-1, 40)).toBe(-1);
    expect(quantize(10, 32)).toBe(0);
  });
  it("agrees with independent mathematical half-up reference over signed values / all shift ranges", () => {
    for (let value = -10000; value <= 10000; value += 37)
      for (let shift = 0; shift < 41; shift++) {
        const expected =
          shift >= 32
            ? value < 0
              ? -1
              : 0
            : Math.max(
                -128,
                Math.min(127, Math.floor(value / 2 ** shift + 0.5)),
              );
        expect(quantize(value, shift)).toBe(expected);
      }
  });
  it("enforces all documented v1 boundaries", () => {
    expect(validateJob(73, 224, 32).errors).toEqual([]);
    expect(validateJob(1, 32, 32).errors).toContain("errataM");
    expect(validateJob(256, 64, 32).errors).toContain("errataF");
    expect(validateJob(2, 512, 64).errors).toContain("errataW");
    expect(validateJob(256, 32, 64).errors).toContain("errataO");
    expect(validateJob(511, 32, 32).errors).toEqual([]);
    expect(validateJob(2, 1024, 32).errors).toContain("errataBlocks");
    expect(validateJob(0, 32, 32).errors).toContain("invalidShape");
  });
});
describe("AXI protocol demo", () => {
  it("holds TDATA, TLAST and TSTRB under backpressure and accepts only on VALID/READY", () => {
    let s = initialAxi();
    s = tickAxi(s, config);
    const beat = s.history[0].feature;
    for (let i = 0; i < 6; i++) {
      s = tickAxi(s, config);
      const held = s.history.at(-1)!.feature;
      expect(held.data).toBe(beat.data);
      expect(held.last).toBe(beat.last);
      expect(held.strb).toBe(beat.strb);
      expect(held.accepted).toBe(false);
      expect(s.indices.feature).toBe(0);
    }
    s = tickAxi(s, { ...config, manualReady: true });
    expect(s.indices.feature).toBe(1);
    expect(s.history.at(-1)!.feature.accepted).toBe(true);
  });
  it("also holds the final TLAST beat during stalls", () => {
    let s = initialAxi();
    for (let i = 0; i < 7; i++)
      s = tickAxi(s, { ...config, manualReady: true });
    for (let i = 0; i < 4; i++) {
      s = tickAxi(s, config);
      expect(s.history.at(-1)!.weight.last).toBe(true);
      expect(s.indices.weight).toBe(7);
    }
    s = tickAxi(s, { ...config, manualReady: true });
    expect(s.indices.weight).toBe(8);
  });
  it("completes the three channels with deterministic seeded random stalls", () => {
    let a = initialAxi(),
      b = initialAxi();
    const cfg = { ...config, stall: "random" as const };
    for (let i = 0; i < 90; i++) {
      a = tickAxi(a, cfg);
      b = tickAxi(b, cfg);
    }
    expect(a).toEqual(b);
    expect(a.indices).toEqual({ feature: 8, weight: 8, result: 4 });
    expect(a.registers.done).toBe(true);
    expect(a.registers.busy).toBe(false);
  });
  it("waits for both AW and W, then holds the B response under backpressure", () => {
    let s = initialAxi();
    s.lite = { kind: "write", address: 4, data: 511, strobe: 15, phase: 0 };
    const cfg = { ...config, responseReady: false };
    for (let i = 0; i < 3; i++) {
      s = tickAxi(s, cfg);
      expect(s.registers.rows).toBe(0);
    }
    s = tickAxi(s, cfg);
    expect(s.registers.rows).toBe(511);
    s = tickAxi(s, cfg);
    expect(s.history.at(-1)!.BVALID).toBe(1);
    expect(s.lite).not.toBeNull();
    s = tickAxi(s, { ...cfg, responseReady: true });
    expect(s.lite).toBeNull();
  });
  it("holds RDATA / RVALID until RREADY", () => {
    let s = initialAxi();
    s.lite = { kind: "read", address: 32, data: 0, strobe: 15, phase: 0 };
    s = tickAxi(s, { ...config, responseReady: false });
    s = tickAxi(s, { ...config, responseReady: false });
    expect(s.history.at(-1)!.RVALID).toBe(1);
    expect(s.history.at(-1)!.RDATA).toBe(0x47454d4d);
    expect(s.lite).not.toBeNull();
  });
});
describe("RTL register-map semantics (software model, not RTL proof)", () => {
  it("preserves byte strobes, field masks and read-only IDs", () => {
    let r = initialRegisters();
    r = registerTick(r, { address: 4, data: 0x1ff, strobe: 1 });
    expect(r.rows).toBe(255);
    r = registerTick(r, { address: 4, data: 0x100, strobe: 2 });
    expect(r.rows).toBe(511);
    r = registerTick(r, { address: 32, data: 0, strobe: 15 });
    expect(readRegister(r, 32)).toBe(0x47454d4d);
    expect(readRegister(r, 36)).toBe(0x01012008);
  });
  it("W1C event in same cycle wins; IRQ uses previous sticky status", () => {
    let r = initialRegisters();
    r.irqEnable = 3;
    r.irqStatus = 3;
    r.error = 1;
    r = registerTick(r, { address: 20, data: 3, strobe: 1 }, { done: true });
    expect(r.irqStatus).toBe(1);
    expect(r.irq).toBe(true);
    r = registerTick(r, { address: 24, data: 1, strobe: 1 }, { partial: 1 });
    expect(r.error).toBe(1);
  });
  it("clear-done is refused while busy and records ERROR bit 2", () => {
    let r = initialRegisters();
    r.busy = true;
    r.done = true;
    r = registerTick(r, { address: 0, data: 1 << 16, strobe: 0 });
    expect(r.clearRefused).toBe(true);
    expect(r.error & 4).toBe(4);
    expect(r.done).toBe(true);
    r.busy = false;
    r = registerTick(r, { address: 0, data: 1 << 16, strobe: 0 });
    expect(r.clearAccepted).toBe(true);
    expect(r.done).toBe(false);
  });
});
describe("animation timeline", () => {
  it("holds exploded pose then collapses, and stops deterministically without looping", () => {
    expect(explodeAt(0)).toBe(0);
    expect(explodeAt(0.5)).toBe(1);
    expect(explodeAt(0.96)).toBe(0);
    expect(advanceAnimation(0.999, 0.1, 3, false)).toEqual({
      progress: 1,
      playing: false,
    });
    expect(advanceAnimation(0.999, 0.1, 3, true).progress).toBeLessThan(0.1);
  });
});
