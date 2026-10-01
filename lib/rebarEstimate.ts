// Standard rebar maths. Unit weight of a round bar ≈ d²/162 kg per metre (d in mm).
export const BAR_SIZES = [8, 10, 12, 16, 20, 25] as const;
export const unitWeight = (diaMm: number) => (diaMm * diaMm) / 162;

const COVER = 0.025; // m of concrete cover each side
const BINDING_WIRE_KG_PER_T = 10;

export type BarLine = { dia: number; length: number; weight: number; label: string };
export type RebarResult = { lines: BarLine[]; totalWeight: number; bindingWireKg: number };

const line = (dia: number, length: number, label: string): BarLine => ({ dia, length, weight: length * unitWeight(dia), label });

const finish = (lines: BarLine[]): RebarResult => {
  const totalWeight = lines.reduce((s, l) => s + l.weight, 0);
  return { lines, totalWeight, bindingWireKg: Math.ceil((totalWeight / 1000) * BINDING_WIRE_KG_PER_T) };
};

/** Mesh for a slab: bars both ways at `spacingMm`, in 1 or 2 layers, plus lap/waste. */
export function slabMesh(lengthM: number, widthM: number, dia: number, spacingMm: number, layers: number, lapPct: number): RebarResult | null {
  const L = lengthM - 2 * COVER;
  const W = widthM - 2 * COVER;
  if (!(L > 0 && W > 0 && spacingMm > 0)) return null;
  const s = spacingMm / 1000;
  const barsAlongLength = Math.floor(W / s) + 1;
  const barsAlongWidth = Math.floor(L / s) + 1;
  const length = layers * (barsAlongLength * L + barsAlongWidth * W) * (1 + lapPct / 100);
  return finish([line(dia, length, `${dia} mm @ ${spacingMm} mm, ${layers === 2 ? 'top & bottom' : 'one layer'}`)]);
}

/** Columns or beams: main bars along the member + closed links (stirrups) at `linkSpacingMm`. */
export function members(
  count: number, lengthM: number, mainBars: number, mainDia: number,
  sectionWmm: number, sectionDmm: number, linkDia: number, linkSpacingMm: number, lapPct: number,
): RebarResult | null {
  if (!(count > 0 && lengthM > 0 && mainBars > 0 && linkSpacingMm > 0)) return null;
  const k = 1 + lapPct / 100;
  const main = count * mainBars * lengthM * k;
  const linkPerimeter = 2 * (sectionWmm / 1000 - 2 * COVER + sectionDmm / 1000 - 2 * COVER) + 0.15; // + hooks
  const linksPerMember = Math.floor((lengthM * 1000) / linkSpacingMm) + 1;
  const links = count * linksPerMember * linkPerimeter * k;
  return finish([
    line(mainDia, main, `${mainBars} × ${mainDia} mm main bars`),
    line(linkDia, links, `${linkDia} mm links @ ${linkSpacingMm} mm (${count * linksPerMember} pcs)`),
  ]);
}

/** Plain weight check: n bars of a given length. */
export function barsWeight(dia: number, lengthM: number, count: number): RebarResult | null {
  if (!(lengthM > 0 && count > 0)) return null;
  return finish([line(dia, lengthM * count, `${count} × ${lengthM} m of ${dia} mm`)]);
}

export const stockBars = (length: number, stockLengthM: number) => Math.ceil(length / stockLengthM);
