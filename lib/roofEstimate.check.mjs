// Run: node lib/roofEstimate.check.mjs
import assert from 'node:assert/strict';
import { estimateRoof } from './roofEstimate.ts';

const base = { overhang: 0, wastePct: 0, coverage: 1, fixingsPerM2: 6 };
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} != ${b}`);

const gable = estimateRoof({ ...base, length: 10, width: 8, style: 'gable', pitchDeg: 30 });
near(gable.area, 80 / Math.cos(Math.PI / 6)); // 92.38 m²
near(gable.ridge, 10);
near(gable.rise, 4 * Math.tan(Math.PI / 6));

const hip = estimateRoof({ ...base, length: 10, width: 8, style: 'hip', pitchDeg: 45 });
near(hip.rise, 4);
near(hip.ridge, 2 + 4 * Math.sqrt(48)); // ridge 2m + four 6.93m hips

const flat = estimateRoof({ ...base, length: 10, width: 8, style: 'flat', pitchDeg: 5 });
near(flat.ridge, 0);

const withOverhang = estimateRoof({ ...base, length: 10, width: 8, style: 'gable', pitchDeg: 0, overhang: 0.5, wastePct: 10, coverage: 1.8 });
near(withOverhang.area, 11 * 9);
assert.equal(withOverhang.sheets, Math.ceil((99 * 1.1) / 1.8)); // 61
assert.equal(withOverhang.fixings, 600); // 594 rounded up to a box of 50

assert.equal(estimateRoof({ ...base, length: 0, width: 8, style: 'gable', pitchDeg: 30 }), null);
console.log('roofEstimate ok');
