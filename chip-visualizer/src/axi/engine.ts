import { initialRegisters, readRegister, registerTick } from "./registers";
import type { Registers } from "./registers";
export type StallMode = "always" | "periodic" | "random" | "manual";
export type Channel = "feature" | "weight" | "result";
export interface Beat {
  valid: boolean;
  ready: boolean;
  data: string;
  strb: string;
  last: boolean;
  accepted: boolean;
  index: number;
  gated: boolean;
}
export interface LiteOp {
  kind: "write" | "read";
  address: number;
  data: number;
  strobe: number;
  phase: number;
  response?: number;
}
export interface AxiSample {
  cycle: number;
  feature: Beat;
  weight: Beat;
  result: Beat;
  busy: boolean;
  done: boolean;
  irq: boolean;
  AWVALID: number;
  AWREADY: number;
  WVALID: number;
  WREADY: number;
  BVALID: number;
  BREADY: number;
  ARVALID: number;
  ARREADY: number;
  RVALID: number;
  RREADY: number;
  RDATA: number;
}
export interface AxiState {
  cycle: number;
  indices: Record<Channel, number>;
  registers: Registers;
  lite: LiteOp | null;
  history: AxiSample[];
  computeStart: number | null;
  lastTransaction: string;
}
export interface AxiConfig {
  stall: StallMode;
  manualReady: boolean;
  seed: number;
  clockGate: boolean;
  responseReady: boolean;
  awDelay: number;
  wDelay: number;
}
export const initialAxi = (): AxiState => ({
  cycle: 0,
  indices: { feature: 0, weight: 0, result: 0 },
  registers: initialRegisters(),
  lite: null,
  history: [],
  computeStart: null,
  lastTransaction: "—",
});
export function readyAt(cycle: number, config: AxiConfig) {
  switch (config.stall) {
    case "always":
      return true;
    case "periodic":
      return cycle % 5 < 3;
    case "manual":
      return config.manualReady;
    case "random": {
      let x = (cycle + config.seed) | 0;
      x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
      x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
      return ((x ^ (x >>> 16)) >>> 0) % 4 !== 0;
    }
  }
}
export function payload(channel: Channel, index: number) {
  const prefix = { feature: 0x10, weight: 0x40, result: 0x80 }[channel];
  return Array.from({ length: 32 }, (_, lane) =>
    ((prefix + index * 3 + lane) & 255).toString(16).padStart(2, "0"),
  )
    .reverse()
    .join("");
}
export function tickAxi(
  current: AxiState,
  config: AxiConfig,
  events: { done?: boolean; partial?: number } = {},
): AxiState {
  const cycle = current.cycle + 1,
    indices = { ...current.indices };
  const ready = readyAt(cycle, config);
  let computeStart = current.computeStart;
  if (computeStart === null && indices.feature === 8 && indices.weight === 8)
    computeStart = cycle;
  const make = (channel: Channel, total: number, available: boolean): Beat => {
    const index = indices[channel];
    const valid = available && index < total;
    const accept = valid && ready;
    if (accept) indices[channel]++;
    return {
      valid,
      ready,
      data: payload(channel, index),
      strb: "ffffffff",
      last: index === total - 1,
      accepted: accept,
      index,
      gated: config.clockGate ? accept : true,
    };
  };
  const feature = make("feature", 8, true),
    weight = make("weight", 8, true),
    result = make(
      "result",
      4,
      computeStart !== null && cycle >= computeStart + 4,
    );
  let lite = current.lite ? { ...current.lite } : null;
  let write;
  let lastTransaction = current.lastTransaction;
  let AWVALID = 0,
    AWREADY = 0,
    WVALID = 0,
    WREADY = 0,
    BVALID = 0,
    ARVALID = 0,
    ARREADY = 0,
    RVALID = 0,
    RDATA = 0;
  if (lite) {
    if (lite.kind === "write") {
      if (lite.phase < 100) {
        AWVALID = Number(lite.phase >= config.awDelay);
        WVALID = Number(lite.phase >= config.wDelay);
        AWREADY = Number(AWVALID && WVALID);
        WREADY = AWREADY;
        if (AWREADY) {
          write = {
            address: lite.address,
            data: lite.data,
            strobe: lite.strobe,
          };
          lite.phase = 100;
        } else lite.phase++;
      } else {
        BVALID = 1;
        if (config.responseReady) {
          lastTransaction = `W 0x${lite.address.toString(16).padStart(2, "0")} ← 0x${lite.data.toString(16).padStart(8, "0")} · OKAY`;
          lite = null;
        }
      }
    } else if (lite.phase === 0) {
      ARVALID = 1;
      ARREADY = 1;
      lite.response = readRegister(current.registers, lite.address);
      lite.phase = 1;
    } else {
      RVALID = 1;
      RDATA = lite.response ?? 0;
      if (config.responseReady) {
        lastTransaction = `R 0x${lite.address.toString(16).padStart(2, "0")} → 0x${RDATA.toString(16).padStart(8, "0")} · OKAY`;
        lite = null;
      }
    }
  }
  const start =
    current.indices.feature === 0 &&
    current.indices.weight === 0 &&
    (feature.accepted || weight.accepted);
  const done = (result.accepted && result.last) || events.done;
  const registers = registerTick(current.registers, write, {
    ...events,
    start,
    done,
  });
  const sample = {
    cycle,
    feature,
    weight,
    result,
    busy: registers.busy,
    done: registers.done,
    irq: registers.irq,
    AWVALID,
    AWREADY,
    WVALID,
    WREADY,
    BVALID,
    BREADY: Number(config.responseReady),
    ARVALID,
    ARREADY,
    RVALID,
    RREADY: Number(config.responseReady),
    RDATA,
  };
  return {
    cycle,
    indices,
    registers,
    lite,
    computeStart,
    lastTransaction,
    history: [...current.history.slice(-511), sample],
  };
}
