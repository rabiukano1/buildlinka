import { useState } from 'react';
import { PRODUCTS } from '../../constants/MockData';
import CategoryShell, { EmptyResult, Footnote, Label, OrderLine, Result, Row, Stepper, Wrap, numeric } from '../../components/CategoryShell';
import { Chip, Field } from '../../components/EngineerUI';
import { blocks } from '../../lib/estimators';

const SIZES = [
  { id: '9', label: '9″ (225 mm)', use: 'External & load-bearing walls' },
  { id: '6', label: '6″ (150 mm)', use: 'Internal partitions' },
];

export default function BlocksScreen() {
  const [size, setSize] = useState('9');
  const [length, setLength] = useState('');
  const [height, setHeight] = useState('3');
  const [doors, setDoors] = useState(1);
  const [windows, setWindows] = useState(1);
  const [waste, setWaste] = useState(5);

  const est = blocks(parseFloat(length), parseFloat(height), doors, windows, waste);
  const product = PRODUCTS.find((p) => p.category === 'Blocks' && p.name.includes(`${size} inch`));

  return (
    <CategoryShell
      title="Blocks"
      category="Blocks"
      emoji="🧱"
      heroTitle="Count your blocks before you build"
      heroSub="Take off doors and windows, add breakage, and order the exact number."
      trust={[['verified', 'Well-cured'], ['local-shipping', 'Site delivery'], ['inventory', 'Bulk loads']]}
      estimatorTitle="Block calculator"
      tips={[
        { icon: 'water-drop', title: 'Curing matters', text: 'Good blocks are cured (kept wet) for at least 7 days. Fresh blocks crumble when knocked.' },
        { icon: 'front-hand', title: 'The drop test', text: 'Drop a block from waist height onto hard ground. A good block may chip but should not break in two.' },
        { icon: 'straighten', title: 'Check the size', text: 'Measure a few blocks — undersized blocks mean more mortar and more blocks than planned.' },
      ]}
      hire={{ title: 'Need a bricklayer?', sub: 'Hire a vetted mason to lay your blocks', icon: 'engineering' }}
    >
      <Label>Block size</Label>
      <Wrap>{SIZES.map((s) => <Chip key={s.id} label={s.label} active={size === s.id} onPress={() => setSize(s.id)} />)}</Wrap>
      <Row>
        <Field label="Total wall length (m)" placeholder="40" keyboardType="decimal-pad" value={length} onChangeText={numeric(setLength)} />
        <Field label="Wall height (m)" placeholder="3" keyboardType="decimal-pad" value={height} onChangeText={numeric(setHeight)} />
      </Row>
      <Row>
        <Stepper label="Doors" value={doors} onChange={setDoors} />
        <Stepper label="Windows" value={windows} onChange={setWindows} />
      </Row>
      <Label>Extra for breakage</Label>
      <Wrap last>{[0, 5, 10].map((w) => <Chip key={w} label={`${w}%`} active={waste === w} onPress={() => setWaste(w)} />)}</Wrap>

      {est ? (
        <Result label="You need about" value={est.blocks.toLocaleString('en-NG')} unit="blocks" metrics={[[`${est.area.toFixed(1)} m²`, 'Wall to build'], [`${est.perM2.toFixed(2)}`, 'Blocks per m²']]}>
          <OrderLine product={product} qty={est.blocks} what="blocks" missingText={`${size}″ blocks aren't sold on BuildLinka yet — share this count with a block maker.`} />
          <Footnote>450 × 225 mm block face with 10 mm joints. Doors 0.9 × 2.1 m, windows 1.2 × 1.2 m.</Footnote>
        </Result>
      ) : (
        <EmptyResult text="Add up the length of all the walls, then enter it with the wall height." />
      )}
    </CategoryShell>
  );
}
