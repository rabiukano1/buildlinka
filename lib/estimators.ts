// Material calculators for the category screens. Pure maths, checked by estimators.check.mjs.
const DOOR_M2 = 0.9 * 2.1;
const WINDOW_M2 = 1.2 * 1.2;
const pos = (...n: number[]) => n.every((x) => x > 0);

/** Blockwork: 450 × 225 mm face + 10 mm joints ≈ 9.25 blocks per m² of wall. */
export function blocks(lengthM: number, heightM: number, doors: number, windows: number, wastePct: number) {
  if (!pos(lengthM, heightM)) return null;
  const area = Math.max(lengthM * heightM - doors * DOOR_M2 - windows * WINDOW_M2, 0);
  const perM2 = 1 / (0.46 * 0.235);
  return { area, perM2, blocks: Math.ceil(area * perM2 * (1 + wastePct / 100)) };
}

/** Floor or wall tiling: area + waste, tile count, ~5 m² per 20 kg bag of adhesive. */
export function tiles(lengthM: number, widthM: number, tileCm: [number, number], wastePct: number) {
  if (!pos(lengthM, widthM, tileCm[0], tileCm[1])) return null;
  const area = lengthM * widthM;
  const withWaste = area * (1 + wastePct / 100);
  return {
    area,
    orderM2: Math.ceil(withWaste),
    tiles: Math.ceil(withWaste / ((tileCm[0] / 100) * (tileCm[1] / 100))),
    adhesiveBags: Math.ceil(area / 5),
  };
}

/** Room painting: four walls (+ ceiling) minus openings, × coats ÷ spread rate. */
export function paint(lengthM: number, widthM: number, heightM: number, doors: number, windows: number, coats: number, ceiling: boolean, m2PerLitre = 10) {
  if (!pos(lengthM, widthM, heightM, coats)) return null;
  const walls = Math.max(2 * (lengthM + widthM) * heightM - doors * DOOR_M2 - windows * WINDOW_M2, 0);
  const area = walls + (ceiling ? lengthM * widthM : 0);
  const litres = (area * coats) / m2PerLitre;
  return { area, litres, buckets20: Math.ceil(litres / 20), tins4: Math.ceil(litres / 4) };
}

/** Pipe run → stock lengths, with an allowance for bends and offcuts. */
export function pipes(runM: number, stockM: number, allowancePct: number) {
  if (!pos(runM, stockM)) return null;
  const total = runM * (1 + allowancePct / 100);
  return { total, pieces: Math.ceil(total / stockM) };
}

export const TANK_SIZES = [500, 750, 1000, 1500, 2000, 3000, 4000, 5000];
/** Overhead tank: people × litres per day × days of storage, rounded up to a stock size. */
export function waterTank(people: number, litresPerPerson: number, days: number) {
  if (!pos(people, litresPerPerson, days)) return null;
  const litres = people * litresPerPerson * days;
  const tank = TANK_SIZES.find((t) => t >= litres);
  return { litres, tank: tank ?? null, tanks5000: tank ? 1 : Math.ceil(litres / 5000) };
}

export const INVERTER_KVA = [1, 1.5, 2.5, 3.5, 5, 7.5, 10, 15];
const CABLE_BY_AMPS: [number, string][] = [[16, '2.5 mm²'], [25, '4 mm²'], [32, '6 mm²'], [45, '10 mm²'], [63, '16 mm²'], [80, '25 mm²']];
/** Load → current at 230 V, inverter size (pf 0.8, 25% headroom), main cable, battery for backup hours. */
export function electricalLoad(watts: number, backupHours: number) {
  if (!pos(watts)) return null;
  const amps = watts / 230;
  const kva = (watts / 0.8 / 1000) * 1.25;
  const batteryKwh = backupHours > 0 ? (watts * backupHours) / 1000 / 0.8 / 0.9 : 0; // 80% depth of discharge, 90% efficiency
  return {
    watts,
    amps,
    inverterKva: INVERTER_KVA.find((k) => k >= kva) ?? null,
    cable: CABLE_BY_AMPS.find(([a]) => a >= amps)?.[1] ?? null,
    batteryKwh,
  };
}

/** Glass panes: area, and weight at 2.5 kg per m² per mm of thickness. */
export function glass(widthM: number, heightM: number, count: number, thicknessMm: number) {
  if (!pos(widthM, heightM, count, thicknessMm)) return null;
  const paneArea = widthM * heightM;
  const paneKg = paneArea * thicknessMm * 2.5;
  return { paneArea, area: paneArea * count, paneKg, totalKg: paneKg * count, needsSafetyGlass: paneArea > 1.5 && thicknessMm < 6 };
}

/** Timber in inches × feet (how it's sold) → cubic metres. */
export const timberM3 = (thicknessIn: number, widthIn: number, lengthFt: number, count: number) =>
  thicknessIn * 0.0254 * widthIn * 0.0254 * lengthFt * 0.3048 * count;

/** Cheapest way to rent for n days given a day rate and an optional week rate. */
export function rental(days: number, dayRate: number, weekRate: number) {
  if (!pos(days, dayRate)) return null;
  if (!(weekRate > 0)) return { cost: days * dayRate, weeks: 0, extraDays: days, saved: 0 };
  const weeks = Math.floor(days / 7);
  const rest = days % 7;
  const cost = weeks * weekRate + Math.min(rest * dayRate, weekRate);
  return { cost, weeks: rest * dayRate > weekRate ? weeks + 1 : weeks, extraDays: rest * dayRate > weekRate ? 0 : rest, saved: days * dayRate - cost };
}
