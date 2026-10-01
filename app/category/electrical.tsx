import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import CategoryShell, { Footnote, Label, Result, Wrap, EmptyResult } from '../../components/CategoryShell';
import { Chip } from '../../components/EngineerUI';
import { electricalLoad } from '../../lib/estimators';

// Typical running watts; nameplates vary.
const APPLIANCES = [
  { id: 'bulb', label: 'LED bulb', icon: 'lightbulb', watts: 10, start: 6 },
  { id: 'fan', label: 'Ceiling fan', icon: 'toys', watts: 75, start: 2 },
  { id: 'tv', label: 'TV', icon: 'tv', watts: 100, start: 1 },
  { id: 'laptop', label: 'Laptop / phone', icon: 'laptop', watts: 65, start: 2 },
  { id: 'fridge', label: 'Fridge', icon: 'kitchen', watts: 150, start: 1 },
  { id: 'freezer', label: 'Deep freezer', icon: 'ac-unit', watts: 200, start: 0 },
  { id: 'pump', label: 'Pumping machine', icon: 'water', watts: 750, start: 0 },
  { id: 'ac', label: 'AC (1.5 HP)', icon: 'air', watts: 1100, start: 0 },
  { id: 'iron', label: 'Pressing iron', icon: 'iron', watts: 1000, start: 0 },
];

export default function ElectricalScreen() {
  const [qty, setQty] = useState<Record<string, number>>(Object.fromEntries(APPLIANCES.map((a) => [a.id, a.start])));
  const [backup, setBackup] = useState(4);

  const watts = APPLIANCES.reduce((s, a) => s + a.watts * (qty[a.id] ?? 0), 0);
  const est = electricalLoad(watts, backup);
  const change = (id: string, d: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(50, (q[id] ?? 0) + d)) }));

  return (
    <CategoryShell
      title="Electrical"
      category="Electrical"
      emoji="⚡"
      heroTitle="Size your inverter, cable and battery"
      heroSub="Tick what you want to power — we work out the load and the gear to match."
      trust={[['verified', 'SON-approved'], ['local-shipping', 'Fast delivery'], ['solar-power', 'Solar ready']]}
      estimatorTitle="Power planner"
      tips={[
        { icon: 'verified', title: 'Buy approved cable', text: 'Fake cable has thin copper and catches fire. Look for SON marks and check the copper is solid, not copper-coloured aluminium.' },
        { icon: 'electrical-services', title: "Don't run heavy loads on inverters", text: 'Pressing irons, kettles and heaters drain batteries fast. Run them on grid or generator power.' },
        { icon: 'power', title: 'Fit a changeover', text: 'A proper changeover switch keeps generator, grid and inverter power from ever meeting — it protects both you and NEPA linemen.' },
      ]}
      hire={{ title: 'Need an electrician?', sub: 'Hire a vetted electrician for wiring and solar', icon: 'bolt' }}
    >
      <Label>What do you want to power?</Label>
      {APPLIANCES.map((a) => {
        const n = qty[a.id] ?? 0;
        return (
          <View key={a.id} style={styles.item}>
            <View style={[styles.icon, n > 0 && styles.iconOn]}>
              <MaterialIcons name={a.icon as any} size={20} color={n > 0 ? Colors.onPrimary : Colors.onSurfaceVariant} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.name}>{a.label}</Text>
              <Text style={styles.watts}>{a.watts} W each</Text>
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => change(a.id, -1)} disabled={n === 0} accessibilityLabel={`Fewer ${a.label}`}>
              <MaterialIcons name="remove" size={18} color={n === 0 ? Colors.outlineVariant : Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qty}>{n}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => change(a.id, 1)} accessibilityLabel={`More ${a.label}`}>
              <MaterialIcons name="add" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        );
      })}

      <Label>Backup time on battery</Label>
      <Wrap last>{[0, 2, 4, 8].map((h) => <Chip key={h} label={h ? `${h} hours` : 'No battery'} active={backup === h} onPress={() => setBackup(h)} />)}</Wrap>

      {est ? (
        <Result
          label="Total load"
          value={watts.toLocaleString('en-NG')}
          unit="watts"
          metrics={[
            [est.inverterKva ? `${est.inverterKva} kVA` : '15 kVA+', 'Inverter / generator'],
            [`${est.amps.toFixed(1)} A`, 'Current at 230 V'],
            [est.cable ?? 'Ask an electrician', 'Main supply cable'],
            [backup ? `${est.batteryKwh.toFixed(1)} kWh` : '—', `Battery for ${backup} h`],
          ]}
        >
          <Footnote>Assumes everything runs at once, with 25% headroom for motor start-up. Fridges and pumps surge 3× on start — your electrician will confirm.</Footnote>
        </Result>
      ) : (
        <EmptyResult text="Add at least one appliance to see your load." />
      )}
    </CategoryShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceVariant + '99', alignItems: 'center', justifyContent: 'center' },
  iconOn: { backgroundColor: Colors.primary },
  name: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  watts: { fontSize: 12, color: Colors.outline },
  btn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 24, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.onSurface },
});
