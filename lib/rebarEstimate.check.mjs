// Run: node lib/rebarEstimate.check.mjs
import assert from 'node:assert/strict';
import { unitWeight, slabMesh, members, barsWeight, stockBars } from './rebarEstimate.ts';

const near = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

near(unitWeight(12), 0.889, 0.001); // published table: 0.888 kg/m
near(unitWeight(16), 1.58, 0.01);

// 5 × 4 m slab, 12 mm @ 200, one layer: 20 bars × 4.95 m + 25 bars × 3.95 m
const slab = slabMesh(5, 4, 12, 200, 1, 0);
near(slab.lines[0].length, 20 * 4.95 + 25 * 3.95);
near(slab.totalWeight, 197.75 * unitWeight(12));
near(slabMesh(5, 4, 12, 200, 2, 0).totalWeight, slab.totalWeight * 2);

// 4 columns, 3 m, 4 × 16 mm, 230 × 230, 8 mm links @ 150
const col = members(4, 3, 4, 16, 230, 230, 8, 150, 0);
near(col.lines[0].length, 48);
const perimeter = 2 * (0.18 + 0.18) + 0.15;
near(col.lines[1].length, 4 * 21 * perimeter);
assert.equal(col.lines.length, 2);

const w = barsWeight(12, 12, 10);
near(w.totalWeight, 120 * unitWeight(12));
assert.equal(w.bindingWireKg, 2); // 1.07 kg → rounds up

assert.equal(stockBars(197.75, 12), 17);
assert.equal(slabMesh(0.04, 4, 12, 200, 1, 0), null);
console.log('rebarEstimate ok');
