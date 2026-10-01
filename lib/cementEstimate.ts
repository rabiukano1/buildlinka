// Dry-volume method: wet volume × dry factor, split by mix ratio, cement at 1440 kg/m³ in 50 kg bags.
export const BAG_KG = 50;
const CEMENT_DENSITY = 1440; // kg/m³
const SAND_T_PER_M3 = 1.6;
const GRAVEL_T_PER_M3 = 1.5;

export type Mix = { cement: number; sand: number; gravel: number; dryFactor: number };

export const MIXES = {
  m15: { cement: 1, sand: 2, gravel: 4, dryFactor: 1.54 }, // general floors, blinding
  m20: { cement: 1, sand: 1.5, gravel: 3, dryFactor: 1.54 }, // slabs, beams, columns
  screed: { cement: 1, sand: 4, gravel: 0, dryFactor: 1.33 },
  plaster: { cement: 1, sand: 6, gravel: 0, dryFactor: 1.33 },
} satisfies Record<string, Mix>;

export type CementEstimate = { volume: number; bags: number; sandT: number; gravelT: number };

export function estimateCement(lengthM: number, widthM: number, thicknessMm: number, mix: Mix, wastePct: number): CementEstimate | null {
  if (!(lengthM > 0 && widthM > 0 && thicknessMm > 0)) return null;
  const volume = lengthM * widthM * (thicknessMm / 1000);
  const dry = volume * mix.dryFactor * (1 + wastePct / 100);
  const parts = mix.cement + mix.sand + mix.gravel;
  return {
    volume,
    bags: Math.ceil(((dry * mix.cement) / parts) * CEMENT_DENSITY / BAG_KG),
    sandT: ((dry * mix.sand) / parts) * SAND_T_PER_M3,
    gravelT: ((dry * mix.gravel) / parts) * GRAVEL_T_PER_M3,
  };
}
