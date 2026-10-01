import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import CategoryShell, { Footnote, Label, Result, Row, Stepper, Wrap, EmptyResult } from '../../components/CategoryShell';
import { Chip } from '../../components/EngineerUI';
import { timberM3 } from '../../lib/estimators';

// Sizes as sold in Nigerian timber markets: inches × inches, lengths in feet.
const SIZES = [
  { id: '2x2', t: 2, w: 2, use: 'Battens, noggins' },
  { id: '2x3', t: 2, w: 3, use: 'Purlins, formwork' },
  { id: '2x4', t: 2, w: 4, use: 'Rafters, studs' },
  { id: '2x6', t: 2, w: 6, use: 'Wall plates, beams' },
  { id: '1x12', t: 1, w: 12, use: 'Planks, formwork' },
];
const LENGTHS = [12, 14, 16];

type Line = { key: string; sizeId: string; lengthFt: number; count: number };

export default function TimberScreen() {
  const [sizeId, setSizeId] = useState('2x4');
  const [lengthFt, setLengthFt] = useState(12);
  const [count, setCount] = useState(10);
  const [lines, setLines] = useState<Line[]>([]);

  const size = SIZES.find((s) => s.id === sizeId)!;
  const volumeOf = (l: Line) => {
    const s = SIZES.find((x) => x.id === l.sizeId)!;
    return timberM3(s.t, s.w, l.lengthFt, l.count);
  };
  const total = lines.reduce((sum, l) => sum + volumeOf(l), 0);
  const pieces = lines.reduce((sum, l) => sum + l.count, 0);

  const addLine = () => {
    setLines((prev) => {
      const same = prev.find((l) => l.sizeId === sizeId && l.lengthFt === lengthFt);
      return same
        ? prev.map((l) => (l === same ? { ...l, count: l.count + count } : l))
        : [...prev, { key: `${sizeId}-${lengthFt}`, sizeId, lengthFt, count }];
    });
  };

  return (
    <CategoryShell
      title="Timber"
      category="Timber"
      emoji="🌲"
      heroTitle="Build your timber list"
      heroSub="Pick sizes the way the market sells them and get the total volume for your quote."
      trust={[['verified', 'Seasoned wood'], ['local-shipping', 'Site delivery'], ['carpenter', 'Cut to length']]}
      estimatorTitle="Timber list"
      tips={[
        { icon: 'water-drop', title: 'Avoid wet wood', text: 'Freshly cut wood shrinks and twists as it dries. Ask for seasoned timber, especially for roofing.' },
        { icon: 'bug-report', title: 'Treat against termites', text: 'Treat roof and formwork timber with preservative before use. Termites destroy untreated softwood fast.' },
        { icon: 'straighten', title: 'Check real sizes', text: 'A "2 by 4" is often a bit under 2 × 4 inches. Measure a few pieces — undersized wood is weaker.' },
      ]}
      hire={{ title: 'Need a carpenter?', sub: 'Hire a vetted carpenter for roofing and formwork', icon: 'carpenter' }}
    >
      <Label>Size (inches)</Label>
      <Wrap>{SIZES.map((s) => <Chip key={s.id} label={s.id.replace('x', ' × ')} active={sizeId === s.id} onPress={() => setSizeId(s.id)} />)}</Wrap>
      <Text style={styles.use}>{size.use}</Text>
      <Label>Length</Label>
      <Wrap>{LENGTHS.map((l) => <Chip key={l} label={`${l} ft`} active={lengthFt === l} onPress={() => setLengthFt(l)} />)}</Wrap>
      <Row>
        <Stepper label="Pieces" value={count} onChange={setCount} min={1} max={500} />
        <TouchableOpacity style={styles.add} onPress={addLine} activeOpacity={0.8}>
          <MaterialIcons name="playlist-add" size={20} color={Colors.onPrimary} />
          <Text style={styles.addText}>Add to list</Text>
        </TouchableOpacity>
      </Row>

      {lines.length ? (
        <Result label="Total timber" value={total.toFixed(3)} unit="m³" metrics={[[String(pieces), 'Pieces'], [String(lines.length), 'Sizes']]}>
          {lines.map((l) => (
            <View key={l.key} style={styles.line}>
              <Text style={styles.lineText}>{l.count} × {l.sizeId.replace('x', '″ × ')}″ × {l.lengthFt} ft</Text>
              <Text style={styles.lineVol}>{volumeOf(l).toFixed(3)} m³</Text>
              <TouchableOpacity onPress={() => setLines((p) => p.filter((x) => x !== l))} hitSlop={8} accessibilityLabel="Remove line">
                <MaterialIcons name="close" size={18} color={Colors.outline} />
              </TouchableOpacity>
            </View>
          ))}
          <Footnote>Share this list with a timber dealer for a quote. Prices are usually per piece of a given size and length.</Footnote>
        </Result>
      ) : (
        <EmptyResult text="Pick a size, length and number of pieces, then tap “Add to list”." />
      )}
    </CategoryShell>
  );
}

const styles = StyleSheet.create({
  use: { fontSize: 13, color: Colors.outline, marginTop: -8, marginBottom: 16 },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, marginTop: 28, borderRadius: 999, backgroundColor: Colors.primary },
  addText: { fontSize: 15, fontWeight: '600', color: Colors.onPrimary },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.divider },
  lineText: { flex: 1, fontSize: 14, color: Colors.onSurface },
  lineVol: { fontSize: 14, fontWeight: '600', color: Colors.onSurface },
});
