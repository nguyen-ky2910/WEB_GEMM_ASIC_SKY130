export const registerMap = [
  {
    address: 0x00,
    name: "SHIFT / STATUS",
    access: "RW / RO",
    mask: 0x3ff,
    description: [
      "W [9:0] shift, [16] clear-done pulse. R [24] busy, [25] done, [26] idle, [27] clear accepted, [28] clear refused.",
      "Ghi [9:0] shift, [16] xung xóa done. Đọc [24] busy, [25] done, [26] idle, [27] clear được chấp nhận, [28] clear bị từ chối.",
    ],
  },
  {
    address: 0x04,
    name: "ROW_COUNT",
    access: "RW",
    mask: 0x1ff,
    description: ["[8:0] row count; reset 0.", "[8:0] số hàng; reset 0."],
  },
  {
    address: 0x08,
    name: "K_BLOCKS",
    access: "RW",
    mask: 0x1f,
    description: ["[4:0] K blocks; reset 0.", "[4:0] số block K; reset 0."],
  },
  {
    address: 0x0c,
    name: "N_BLOCKS",
    access: "RW",
    mask: 0x1f,
    description: ["[4:0] N blocks; reset 0.", "[4:0] số block N; reset 0."],
  },
  {
    address: 0x10,
    name: "IRQ_ENABLE",
    access: "RW",
    mask: 3,
    description: [
      "[0] job done, [1] error. IRQ is registered, level high.",
      "[0] job done, [1] lỗi. IRQ được đăng ký, mức cao.",
    ],
  },
  {
    address: 0x14,
    name: "IRQ_STATUS",
    access: "R/W1C",
    mask: 3,
    description: [
      "[0] done event, [1] error. Write 1 clears; concurrent event wins.",
      "[0] sự kiện done, [1] lỗi. Ghi 1 để xóa; sự kiện đồng thời ưu tiên.",
    ],
  },
  {
    address: 0x18,
    name: "ERROR",
    access: "R/W1C",
    mask: 7,
    description: [
      "[0] partial feature TSTRB, [1] partial weight TSTRB, [2] busy clear refused.",
      "[0] TSTRB feature không đầy đủ, [1] TSTRB weight không đầy đủ, [2] từ chối clear khi busy.",
    ],
  },
  {
    address: 0x1c,
    name: "JOB_CYCLES",
    access: "RO",
    mask: 0,
    description: [
      "Saturating 32-bit job counter; first input through last result beat.",
      "Bộ đếm job 32 bit bão hòa; từ đầu vào đầu tiên đến beat kết quả cuối.",
    ],
  },
  {
    address: 0x20,
    name: "IP_ID",
    access: "RO",
    mask: 0,
    description: ["0x47454D4D = GEMM.", "0x47454D4D = GEMM."],
  },
  {
    address: 0x24,
    name: "IP_VERSION",
    access: "RO",
    mask: 0,
    description: [
      "0x01012008 = v1.1, array 32, INT8.",
      "0x01012008 = v1.1, mảng 32, INT8.",
    ],
  },
] as const;
export interface Registers {
  shift: number;
  rows: number;
  k: number;
  n: number;
  irqEnable: number;
  irqStatus: number;
  error: number;
  cycles: number;
  busy: boolean;
  done: boolean;
  irq: boolean;
  clearAccepted: boolean;
  clearRefused: boolean;
}
export const initialRegisters = (): Registers => ({
  shift: 0,
  rows: 0,
  k: 0,
  n: 0,
  irqEnable: 0,
  irqStatus: 0,
  error: 0,
  cycles: 0,
  busy: false,
  done: false,
  irq: false,
  clearAccepted: false,
  clearRefused: false,
});
export function readRegister(r: Registers, address: number) {
  const values: Record<number, number> = {
    0:
      r.shift |
      (Number(r.busy) << 24) |
      (Number(r.done) << 25) |
      (Number(!r.busy) << 26) |
      (Number(r.clearAccepted) << 27) |
      (Number(r.clearRefused) << 28),
    4: r.rows,
    8: r.k,
    12: r.n,
    16: r.irqEnable,
    20: r.irqStatus,
    24: r.error,
    28: r.cycles,
    32: 0x47454d4d,
    36: 0x01012008,
  };
  return (values[address & 0x3c] ?? 0) >>> 0;
}
export function registerTick(
  current: Registers,
  write?: { address: number; data: number; strobe: number },
  events: {
    done?: boolean;
    partial?: number;
    busy?: boolean;
    start?: boolean;
  } = {},
): Registers {
  const r = {
    ...current,
    irq: Boolean(current.irqStatus & current.irqEnable),
    clearAccepted: false,
    clearRefused: false,
  };
  let clearIRQ = 0,
    clearError = 0,
    setError = events.partial ?? 0;
  if (write) {
    const { data, strobe } = write;
    const addr = write.address & 0x3c;
    const byteMask = Array.from({ length: 4 }, (_, i) =>
      strobe & (1 << i) ? 0xff << (i * 8) : 0,
    ).reduce((a, b) => a | b, 0);
    const apply = (old: number, mask: number) =>
      ((old & ~byteMask) | (data & byteMask)) & mask;
    if (addr === 0) {
      r.shift = apply(r.shift, 0x3ff);
      if (data & 0x10000) {
        if (current.busy) {
          r.clearRefused = true;
          setError |= 4;
        } else {
          r.done = false;
          r.clearAccepted = true;
        }
      }
    }
    if (addr === 4) r.rows = apply(r.rows, 0x1ff);
    if (addr === 8) r.k = apply(r.k, 31);
    if (addr === 12) r.n = apply(r.n, 31);
    if (addr === 16) r.irqEnable = apply(r.irqEnable, 3);
    if (strobe & 1 && addr === 20) clearIRQ = data & 3;
    if (strobe & 1 && addr === 24) clearError = data & 7;
  }
  r.irqStatus =
    (r.irqStatus & ~clearIRQ) | (events.done ? 1 : 0) | (setError ? 2 : 0);
  r.error = (r.error & ~clearError) | setError;
  if (events.start) {
    r.busy = true;
    r.done = false;
    r.cycles = 1;
  } else if (current.busy) r.cycles = Math.min(0xffffffff, current.cycles + 1);
  if (events.busy !== undefined) r.busy = events.busy;
  if (events.done) {
    r.done = true;
    r.busy = false;
  }
  return r;
}
