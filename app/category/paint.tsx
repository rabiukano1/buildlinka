import { useState } from 'react';
import { PRODUCTS } from '../../constants/MockData';
import CategoryShell, { EmptyResult, Footnote, Label, OrderLine, Result, Row, Stepper, Wrap, numeric } from '../../components/CategoryShell';
import { Chip, Field } from '../../components/EngineerUI';
import { paint } from '../../lib/estimators';

const FINISHES = [
  { id: 'emulsion', label: 'Emulsion', rate: 10, note: 'Walls & ceilings' },
  { id: 'gloss', label: 'Gloss', rate: 12, note: 'Doors, wood, metal' },
  { id: 'texture', label: 'Textured', rate: 4, note: 'Exterior walls' },
];

export default function PaintScreen() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('3');
  const [doors, setDoors] = useState(1);
  const [windows, setWindows] = useState(1);
  const [coats, setCoats] = useState(2);
  const [ceiling, setCeiling] = useState(false);
  const [rooms, setRooms] = useState(1);
  const [finishId, setFinishId] = useState('emulsion');

  const finish = FINISHES.find((f) => f.id === finishId)!;
  const one = paint(parseFloat(length), parseFloat(width), parseFloat(height), doors, windows, coats, ceiling, finish.rate);
  const litres = one ? one.litres * rooms : 0;
  const buckets = Math.ceil(litres / 20);
  const product = PRODUCTS.find((p) => p.category === 'Paint' && p.name.toLowerCase().includes(finishId));

  return (
    <CategoryShell
      title="Paint"
      category="Paint"
      emoji="🎨"
      heroTitle="Paint every room, no half-empty buckets"
      heroSub="Measure once — we take off doors and windows and size it in buckets."
      trust={[['verified', 'Genuine brands'], ['local-shipping', 'Fast delivery'], ['palette', 'Any colour']]}
      estimatorTitle="Paint calculator"
      tips={[
        { icon: 'format-paint', title: 'Prime new walls', text: 'New plaster soaks up paint. One coat of primer or thinned emulsion first saves paint on the top coats.' },
        { icon: 'palette', title: 'Mix buckets together', text: 'Pour all buckets of one colour into a big container and stir — this hides small shade differences.' },
        { icon: 'event', title: 'Check the date', text: 'Old emulsion goes lumpy and smells. Check the production date and that the lid seal is unbroken.' },
      ]}
      hire={{ title: 'Need a painter?', sub: 'Hire a vetted painter for inside or outside', icon: 'format-paint' }}
    >
      <Label>Paint type</Label>
      <Wrap>{FINISHES.map((f) => <Chip key={f.id} label={f.label} active={finishId === f.id} onPress={() => setFinishId(f.id)} />)}</Wrap>
      <Row>
        <Field label="Room length (m)" placeholder="4" keyboardType="decimal-pad" value={length} onChangeText={numeric(setLength)} />
        <Field label="Room width (m)" placeholder="4" keyboardType="decimal-pad" value={width} onChangeText={numeric(setWidth)} />
        <Field label="Height (m)" placeholder="3" keyboardType="decimal-pad" value={height} onChangeText={numeric(setHeight)} />
      </Row>
      <Row>
        <Stepper label="Doors" value={doors} onChange={setDoors} />
        <Stepper label="Windows" value={windows} onChange={setWindows} />
        <Stepper label="Same rooms" value={rooms} onChange={setRooms} min={1} />
      </Row>
      <Label>Coats</Label>
      <Wrap>{[1, 2, 3].map((c) => <Chip key={c} label={`${c} coat${c > 1 ? 's' : ''}`} active={coats === c} onPress={() => setCoats(c)} />)}</Wrap>
      <Wrap last>
        <Chip label="Walls only" active={!ceiling} onPress={() => setCeiling(false)} />
        <Chip label="Walls + ceiling" active={ceiling} onPress={() => setCeiling(true)} />
      </Wrap>

      {one ? (
        <Result label="You need about" value={litres.toFixed(1)} unit="litres" metrics={[[`${buckets}`, '20 L buckets'], [`${Math.ceil(litres / 4)}`, 'or 4 L tins'], [`${(one.area * rooms).toFixed(0)} m²`, 'Surface to paint']]}>
          <OrderLine product={product} qty={buckets} what="buckets" missingText={`${finish.label} paint isn't sold on BuildLinka yet — share this list with a paint dealer.`} />
          <Footnote>{finish.label} covers about {finish.rate} m² per litre per coat. Rough or new walls can take 20% more.</Footnote>
        </Result>
      ) : (
        <EmptyResult text="Enter the room's length, width and height." />
      )}
    </CategoryShell>
  );
}
