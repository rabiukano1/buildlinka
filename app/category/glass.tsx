import { useState } from 'react';
import CategoryShell, { EmptyResult, Footnote, Label, Notice, Result, Row, Stepper, Wrap, numeric } from '../../components/CategoryShell';
import { Chip, Field } from '../../components/EngineerUI';
import { glass } from '../../lib/estimators';

const THICKNESS = [4, 5, 6, 8, 10];
const TYPES = [
  { id: 'clear', label: 'Clear' },
  { id: 'tinted', label: 'Tinted' },
  { id: 'frosted', label: 'Frosted' },
  { id: 'tempered', label: 'Tempered' },
  { id: 'mirror', label: 'Mirror' },
];

export default function GlassScreen() {
  const [type, setType] = useState('clear');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [count, setCount] = useState(1);
  const [thickness, setThickness] = useState(5);

  const est = glass(parseFloat(width), parseFloat(height), count, thickness);

  return (
    <CategoryShell
      title="Glass"
      category="Glass"
      emoji="🪟"
      heroTitle="Measure glass the right way"
      heroSub="Work out area, weight and the safe thickness for windows, doors and mirrors."
      trust={[['verified', 'Cut to size'], ['local-shipping', 'Careful delivery'], ['shield', 'Safety glass']]}
      estimatorTitle="Glass calculator"
      tips={[
        { icon: 'shield', title: 'Doors need safety glass', text: 'Use tempered or laminated glass for doors, low windows and showers. It breaks into blunt pieces instead of sharp shards.' },
        { icon: 'straighten', title: 'Measure the frame, then subtract', text: 'Cutters usually take 3–5 mm off each side of the frame opening so the glass fits. Tell them the frame size.' },
        { icon: 'wb-sunny', title: 'Tint for heat', text: 'Tinted or reflective glass on west-facing windows keeps rooms noticeably cooler.' },
      ]}
      hire={{ title: 'Need a glazier?', sub: 'Hire a vetted installer for windows and doors', icon: 'window' }}
    >
      <Label>Glass type</Label>
      <Wrap>{TYPES.map((t) => <Chip key={t.id} label={t.label} active={type === t.id} onPress={() => setType(t.id)} />)}</Wrap>
      <Row>
        <Field label="Pane width (m)" placeholder="1.2" keyboardType="decimal-pad" value={width} onChangeText={numeric(setWidth)} />
        <Field label="Pane height (m)" placeholder="1.5" keyboardType="decimal-pad" value={height} onChangeText={numeric(setHeight)} />
      </Row>
      <Stepper label="Number of panes" value={count} onChange={setCount} min={1} />
      <Label>Thickness</Label>
      <Wrap last>{THICKNESS.map((t) => <Chip key={t} label={`${t} mm`} active={thickness === t} onPress={() => setThickness(t)} />)}</Wrap>

      {est ? (
        <Result
          label="Total glass"
          value={est.area.toFixed(2)}
          unit="m²"
          metrics={[[`${est.paneArea.toFixed(2)} m²`, 'Each pane'], [`${est.paneKg.toFixed(1)} kg`, 'Each pane weighs'], [`${est.totalKg.toFixed(0)} kg`, 'Total weight']]}
        >
          {est.needsSafetyGlass && type !== 'tempered' && (
            <Notice icon="warning-amber" text={`Panes over 1.5 m² should be at least 6 mm, or tempered. ${thickness} mm can crack under wind load.`} />
          )}
          {est.paneKg > 25 && <Notice icon="groups" text="Each pane is over 25 kg — plan for two people to carry and fit it." />}
          <Footnote>Glass weighs about 2.5 kg per m² for every mm of thickness. Ask a glass vendor to quote this list.</Footnote>
        </Result>
      ) : (
        <EmptyResult text="Enter the size of one pane, then how many you need." />
      )}
    </CategoryShell>
  );
}
