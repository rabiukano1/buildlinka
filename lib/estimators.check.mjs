// Run: node lib/estimators.check.mjs
import assert from 'node:assert/strict';
import { blocks, tiles, paint, pipes, waterTank, electricalLoad, glass, timberM3, rental } from './estimators.ts';

const near = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

// 10 m × 3 m wall, one door, one window: 30 − 1.89 − 1.44 = 26.67 m² × 9.25 ≈ 247 blocks
const b = blocks(10, 3, 1, 1, 0);
near(b.area, 26.67);
assert.equal(b.blocks, 247);
assert.equal(blocks(1, 2, 2, 0, 0).blocks, 0); // openings bigger than wall clamp to 0

// 5 × 4 m floor in 60 × 60 tiles, 10% waste: 22 m² → 62 tiles, 4 bags adhesive
const t = tiles(5, 4, [60, 60], 10);
assert.equal(t.orderM2, 22);
assert.equal(t.tiles, 62);
assert.equal(t.adhesiveBags, 4);

// 4 × 4 × 3 m room, 1 door, 1 window, 2 coats, no ceiling: (48 − 3.33) × 2 / 10 = 8.93 L
const p = paint(4, 4, 3, 1, 1, 2, false);
near(p.litres, 8.934);
assert.equal(p.buckets20, 1);
assert.equal(p.tins4, 3);
near(paint(4, 4, 3, 0, 0, 1, true).area, 48 + 16);

assert.deepEqual(pipes(40, 9, 10), { total: 44, pieces: 5 });

assert.equal(waterTank(6, 100, 2).tank, 1500);
assert.equal(waterTank(30, 100, 3).tank, null); // 9000 L → more than one 5000 L tank
assert.equal(waterTank(30, 100, 3).tanks5000, 2);

// 2000 W → 8.7 A, 3.125 kVA → 3.5 kVA inverter, 2.5 mm² cable; 4 h backup → 11.1 kWh battery
const e = electricalLoad(2000, 4);
near(e.amps, 8.696);
assert.equal(e.inverterKva, 3.5);
assert.equal(e.cable, '2.5 mm²');
near(e.batteryKwh, 11.11);
assert.equal(electricalLoad(10000, 0).cable, '10 mm²'); // 43.5 A

const g = glass(1.2, 1.5, 4, 5);
near(g.area, 7.2);
near(g.paneKg, 22.5);
assert.equal(g.needsSafetyGlass, true); // 1.8 m² at 5 mm
assert.equal(glass(1, 1, 1, 6).needsSafetyGlass, false);

near(timberM3(2, 4, 12, 1), 0.01888, 0.0001); // one 2×4 × 12 ft

assert.equal(rental(3, 10000, 50000).cost, 30000);
assert.equal(rental(6, 10000, 50000).cost, 50000); // week rate beats 6 days
assert.equal(rental(9, 10000, 50000).cost, 70000);
assert.equal(rental(9, 10000, 0).cost, 90000);
console.log('estimators ok');
