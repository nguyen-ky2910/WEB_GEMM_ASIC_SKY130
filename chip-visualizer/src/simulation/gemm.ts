export type Matrix = number[][];
export function int8(value: number) {
  return Math.max(-128, Math.min(127, Math.trunc(value)));
}
// Right_shifter.v: arithmetic shift, add round bit (ties toward +infinity), saturate.
// BigInt makes signed 32-bit wrap and sign extension explicit, including negative ties.
export function quantize(value: number, shift: number) {
  const v = BigInt.asIntN(32, BigInt(Math.trunc(value)));
  const sh = Math.max(0, Math.min(1023, Math.trunc(shift)));
  const s = sh >= 32 ? (v < 0n ? -1n : 0n) : v >> BigInt(sh);
  const r = sh === 0 || sh >= 32 ? 0n : (v >> BigInt(sh - 1)) & 1n;
  return Number(s + r > 127n ? 127n : s + r < -128n ? -128n : s + r);
}
export function multiply(a: Matrix, b: Matrix): Matrix {
  if (
    !a.length ||
    !b.length ||
    a[0].length !== b.length ||
    a.some((r) => r.length !== b.length) ||
    b.some((r) => r.length !== b[0].length)
  )
    throw new Error("Incompatible matrix dimensions");
  return a.map((row) =>
    b[0].map((_, j) =>
      Number(
        BigInt.asIntN(
          32,
          row.reduce(
            (sum, v, k) => sum + BigInt(int8(v)) * BigInt(int8(b[k][j])),
            0n,
          ),
        ),
      ),
    ),
  );
}
export function partialProduct(a: Matrix, b: Matrix, steps: number): Matrix {
  const m = a.length,
    n = b[0].length,
    k = b.length;
  const c = Array.from({ length: m }, () => Array(n).fill(0) as number[]);
  for (let step = 0; step < Math.min(steps, m * n * k); step++) {
    const i = Math.floor(step / (n * k)),
      j = Math.floor(step / k) % n,
      kk = step % k;
    c[i][j] = (c[i][j] + int8(a[i][kk]) * int8(b[kk][j])) | 0;
  }
  return c;
}
export function validateJob(m: number, k: number, n: number) {
  const kb = Math.ceil(k / 32),
    nb = Math.ceil(n / 32);
  const errors: (
    | "invalidShape"
    | "errataM"
    | "errataF"
    | "errataW"
    | "errataO"
    | "errataBlocks"
  )[] = [];
  if (![m, k, n].every((x) => Number.isInteger(x) && x > 0))
    return {
      kb,
      nb,
      feature: 0,
      weight: 0,
      output: 0,
      errors: ["invalidShape"] as typeof errors,
    };
  if (m < 2) errors.push("errataM");
  if (m * kb > 511) errors.push("errataF");
  if (32 * kb * nb > 1023) errors.push("errataW");
  if (m * nb > 511) errors.push("errataO");
  if (kb > 31 || nb > 31) errors.push("errataBlocks");
  return {
    kb,
    nb,
    feature: m * kb,
    weight: 32 * kb * nb,
    output: m * nb,
    errors,
  };
}
