// Run: node lib/cementEstimate.check.mjs
import assert from 'node:assert/strict';
import { estimateCement, MIXES } from './cementEstimate.ts';

// 1 m³ of 1:2:4 concrete ≈ 6.3 bags — the textbook figure.
const cube = estimateCement(1, 1, 1000, MIXES.m15, 0);
assert.equal(cube.bags, 7); // 6.34 rounded up
assert.ok(Math.abs(cube.sandT - 0.704) < 0.01);
assert.ok(Math.abs(cube.gravelT - 1.32) < 0.01);

// 10 × 10 m floor, 100 mm thick (old screen claimed 22 bags).
assert.equal(estimateCement(10, 10, 100, MIXES.m15, 0).bags, 64);

// 100 m² of 12 mm 1:6 plaster ≈ 6–7 bags, no gravel.
const plaster = estimateCement(10, 10, 12, MIXES.plaster, 0);
assert.equal(plaster.bags, 7);
assert.equal(plaster.gravelT, 0);

// Waste is added before rounding.
assert.ok(estimateCement(10, 10, 100, MIXES.m15, 10).bags > 64);
assert.equal(estimateCement(0, 10, 100, MIXES.m15, 0), null);
console.log('cementEstimate ok');
