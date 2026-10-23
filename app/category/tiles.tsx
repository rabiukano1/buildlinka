import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import CategoryShell, { EmptyResult, Footnote, Label, OrderLine, Result, Row, Wrap, numeric } from '../../components/CategoryShell';
import { Chip, Field } from '../../components/EngineerUI';
import { tiles } from '../../lib/estimators';

const SIZES: [number, number][] = [[30, 30], [40, 40], [60, 60], [60, 120]];
const LAYOUTS = [
  { id: 'straight', label: 'Straight', waste: 10 },
  { id: 'diagonal', label: 'Diagonal', waste: 15 },
];

export default function TilesScreen() {
  const [surface, setSurface] = useState<'floor' | 'wall'>('floor');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [size, setSize] = useState<[number, number]>([60, 60]);
  const [layout, setLayout] = useState('straight');

  const waste = LAYOUTS.find((l) => l.id === layout)!.waste;
  const est = tiles(parseFloat(length), parseFloat(width), size, waste);
  const tilesProducts = useQuery(api.products.list, { category: 'Tiles' }) ?? [];
  const product = tilesProducts.find((p) => p.name.includes(`${size[0]}x${size[1]}`));

  return (
    <CategoryShell
      title="Tiles"
      category="Tiles"
      emoji="🏛️"
      heroTitle="Tile any room without running short"
      heroSub="Get tile count, square metres to order and adhesive — all from one batch."
      trust={[['verified', 'Grade A'], ['local-shipping', 'Careful delivery'], ['palette', 'Floor & wall']]}
      estimatorTitle="Tile calculator"
      tips={[
        { icon: 'qr-code', title: 'Buy from one batch', text: 'Shades vary between production batches. Order everything at once and check the batch number on every box.' },
        { icon: 'add-box', title: 'Keep spares', text: 'Store a few spare tiles. Matching a broken tile years later is almost impossible.' },
        { icon: 'water', title: 'Slip resistance', text: 'Use matt or textured tiles in bathrooms, kitchens and outdoors — glossy tiles get slippery when wet.' },
      ]}
      hire={{ title: 'Need a tiler?', sub: 'Hire a vetted tiler for floors and walls', icon: 'grid-view' }}
    >
      <Label>Surface</Label>
      <Wrap>
        <Chip label="Floor" icon="crop-square" active={surface === 'floor'} onPress={() => setSurface('floor')} />
        <Chip label="Wall" icon="wallpaper" active={surface === 'wall'} onPress={() => setSurface('wall')} />
      </Wrap>
      <Row>
        <Field label={surface === 'floor' ? 'Room length (m)' : 'Wall width (m)'} placeholder="5" keyboardType="decimal-pad" value={length} onChangeText={numeric(setLength)} />
        <Field label={surface === 'floor' ? 'Room width (m)' : 'Wall height (m)'} placeholder="4" keyboardType="decimal-pad" value={width} onChangeText={numeric(setWidth)} />
      </Row>
      <Label>Tile size (cm)</Label>
      <Wrap>{SIZES.map((s) => <Chip key={s.join()} label={`${s[0]} × ${s[1]}`} active={size === s} onPress={() => setSize(s)} />)}</Wrap>
      <Label>Layout</Label>
      <Wrap last>{LAYOUTS.map((l) => <Chip key={l.id} label={`${l.label} (+${l.waste}%)`} active={layout === l.id} onPress={() => setLayout(l.id)} />)}</Wrap>

      {est ? (
        <Result label="Order" value={`${est.orderM2} m²`} metrics={[[est.tiles.toLocaleString('en-NG'), `Tiles (${size[0]}×${size[1]} cm)`], [`${est.adhesiveBags} bags`, 'Tile adhesive (20 kg)'], [`${est.area.toFixed(1)} m²`, 'Actual area']]}>
          <OrderLine product={product} qty={est.orderM2} what="m²" missingText={`${size[0]} × ${size[1]} cm tiles aren't sold on BuildLinka yet — share this list with a tile vendor.`} />
          <Footnote>Includes {waste}% for cuts and breakage. Adhesive at about 5 m² per 20 kg bag.</Footnote>
        </Result>
      ) : (
        <EmptyResult text="Enter the size of the floor or wall to tile." />
      )}
    </CategoryShell>
  );
}
