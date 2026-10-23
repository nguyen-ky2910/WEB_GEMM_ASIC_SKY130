export interface ViewSettings {
  autoRotate: boolean;
  rotateSpeed: number;
  explode: number;
  autoExplode: boolean;
  playing: boolean;
  progress: number;
  loop: boolean;
  speed: number;
  distance: number;
  labels: boolean;
  peIDs: boolean;
  sramIDs: boolean;
  substrate: boolean;
  rows: boolean;
  sram: boolean;
  axi: boolean;
  power: boolean;
  clock: boolean;
  routes: boolean;
  pins: boolean;
  metal: boolean;
  legend: boolean;
  opacity: number;
  xray: boolean;
  wireframe: boolean;
  section: boolean;
  isolate: boolean;
  projection: "perspective" | "orthographic";
  quality: "low" | "balanced" | "high";
}
export const defaultSettings: ViewSettings = {
  autoRotate: false,
  rotateSpeed: 0.4,
  explode: 0,
  autoExplode: true,
  playing: false,
  progress: 0,
  loop: true,
  speed: 1,
  distance: 1.5,
  labels: true,
  peIDs: false,
  sramIDs: false,
  substrate: true,
  rows: true,
  sram: true,
  axi: true,
  power: false,
  clock: false,
  routes: false,
  pins: false,
  metal: false,
  legend: true,
  opacity: 1,
  xray: false,
  wireframe: false,
  section: false,
  isolate: false,
  projection: "perspective",
  quality: "balanced",
};
export function explodeAt(progress: number) {
  const p = ((progress % 1) + 1) % 1;
  return p < 0.4 ? p / 0.4 : p < 0.55 ? 1 : p < 0.95 ? 1 - (p - 0.55) / 0.4 : 0;
}
export function advanceAnimation(
  progress: number,
  delta: number,
  speed: number,
  loop: boolean,
) {
  const next = progress + (Math.min(delta, 0.1) * speed) / 12;
  return next >= 1
    ? loop
      ? { progress: next % 1, playing: true }
      : { progress: 1, playing: false }
    : { progress: next, playing: true };
}
