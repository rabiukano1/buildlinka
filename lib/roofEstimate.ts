export type RoofStyle = 'gable' | 'hip' | 'flat';

export type RoofInput = {
  length: number; // building length, m
  width: number; // building width, m
  style: RoofStyle;
  pitchDeg: number;
  overhang: number; // eaves overhang each side, m
  wastePct: number;
  coverage: number; // effective m² one sheet covers after overlaps
  fixingsPerM2: number;
};

export type RoofEstimate = {
  area: number; // sloped roof surface, m²
  ridge: number; // ridge + hip lines needing ridge caps, m
  rise: number; // eaves-to-ridge height, m
  sheets: number;
  fixings: number;
};

// Every slope of a gable or hip roof shares one pitch, so the sloped area is plan area / cos(pitch).
// "flat" is a low single-slope (lean-to) roof spanning the full width.
export function estimateRoof(i: RoofInput): RoofEstimate | null {
  if (!(i.length > 0 && i.width > 0 && i.coverage > 0)) return null;
  const L = i.length + 2 * i.overhang;
  const W = i.width + 2 * i.overhang;
  const rad = (i.pitchDeg * Math.PI) / 180;
  const area = (L * W) / Math.cos(rad);
  const rise = i.style === 'flat' ? W * Math.tan(rad) : (W / 2) * Math.tan(rad);
  const hipLine = Math.sqrt(2 * (W / 2) ** 2 + rise ** 2);
  const ridge = i.style === 'gable' ? L : i.style === 'hip' ? Math.max(L - W, 0) + 4 * hipLine : 0;
  return {
    area,
    ridge,
    rise,
    sheets: Math.ceil((area * (1 + i.wastePct / 100)) / i.coverage),
    fixings: Math.ceil((area * i.fixingsPerM2) / 50) * 50,
  };
}
