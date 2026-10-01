import { useState } from 'react';
import { PRODUCTS } from '../../constants/MockData';
import CategoryShell, { EmptyResult, Footnote, Label, ModeTabs, Notice, OrderLine, Result, Row, Stepper, Wrap, numeric } from '../../components/CategoryShell';
import { Chip, Field } from '../../components/EngineerUI';
import { pipes, waterTank } from '../../lib/estimators';

const MODES = [
  { id: 'pipe', label: 'Pipe run', icon: 'linear-scale' },
  { id: 'tank', label: 'Water tank', icon: 'water-drop' },
] as const;

// "PVC Water Pipe 3/4 inch (9m)" → 9
const stockLength = (name: string) => Number(name.match(/\((\d+(?:\.\d+)?)\s*m\)/i)?.[1] ?? 6);

export default function PlumbingScreen() {
  const [mode, setMode] = useState<'pipe' | 'tank'>('pipe');
  const [run, setRun] = useState('');
  const [allowance, setAllowance] = useState(10);
  const [people, setPeople] = useState(5);
  const [usage, setUsage] = useState(100);
  const [days, setDays] = useState(2);

  const product = PRODUCTS.find((p) => p.category === 'Plumbing' && /pipe/i.test(p.name));
  const pipeLen = product ? stockLength(product.name) : 6;
  const pipe = pipes(parseFloat(run), pipeLen, allowance);
  const tank = waterTank(people, usage, days);

  return (
    <CategoryShell
      title="Plumbing"
      category="Plumbing"
      emoji="🔧"
      heroTitle="Plan pipes and water storage"
      heroSub="Turn your pipe run into lengths to buy, and size an overhead tank for your household."
      trust={[['verified', 'Pressure-rated'], ['local-shipping', 'Site delivery'], ['build', 'Fittings']]}
      estimatorTitle="Plumbing planner"
      tips={[
        { icon: 'speed', title: 'Pressure rating', text: 'Supply lines need pressure-rated pipe (PN10 or higher). Thin drainage pipe will burst under pump pressure.' },
        { icon: 'wb-sunny', title: 'Sun damage', text: 'Ordinary PVC goes brittle in sunlight. Bury it, paint it, or use UV-resistant pipe outside.' },
        { icon: 'local-drink', title: 'Food-grade tanks', text: 'Drinking-water tanks should be food-grade, opaque and have a tight lid to stop algae and mosquitoes.' },
      ]}
      hire={{ title: 'Need a plumber?', sub: 'Hire a vetted plumber for installs and repairs', icon: 'plumbing' }}
    >
      <ModeTabs modes={MODES} value={mode} onChange={setMode} />

      {mode === 'pipe' ? (
        <>
          <Field label="Total pipe run (m)" placeholder="40" keyboardType="decimal-pad" value={run} onChangeText={numeric(setRun)} />
          <Label>Allowance for bends & offcuts</Label>
          <Wrap last>{[5, 10, 15].map((a) => <Chip key={a} label={`+${a}%`} active={allowance === a} onPress={() => setAllowance(a)} />)}</Wrap>
          {pipe ? (
            <Result label="Buy" value={String(pipe.pieces)} unit={`lengths of ${pipeLen} m`} metrics={[[`${pipe.total.toFixed(1)} m`, 'Pipe incl. allowance'], [`${Math.ceil(pipe.total / 3)}`, 'Fittings (rough)']]}>
              <OrderLine product={product} qty={pipe.pieces} what="pipes" missingText="Pipes aren't sold on BuildLinka yet — share this list with a plumbing vendor." />
              <Footnote>Measure along the walls where the pipe will actually run. Fittings estimate assumes about one every 3 m.</Footnote>
            </Result>
          ) : (
            <EmptyResult text="Add up the length of pipe from the tank to every tap, then enter it." />
          )}
        </>
      ) : (
        <>
          <Row>
            <Stepper label="People" value={people} onChange={setPeople} min={1} max={60} />
            <Stepper label="Days of storage" value={days} onChange={setDays} min={1} max={7} />
          </Row>
          <Label>Water use per person per day</Label>
          <Wrap last>{[60, 100, 150].map((u) => <Chip key={u} label={`${u} L${u === 100 ? ' (typical)' : ''}`} active={usage === u} onPress={() => setUsage(u)} />)}</Wrap>
          {tank && (
            <Result
              label="Recommended tank"
              value={tank.tank ? tank.tank.toLocaleString('en-NG') : `${tank.tanks5000} × 5,000`}
              unit="litres"
              metrics={[[`${tank.litres.toLocaleString('en-NG')} L`, 'Water needed'], [`${people} × ${usage} L × ${days}`, 'People × use × days']]}
            >
              <Notice icon="info-outline" text="Tanks aren't sold on BuildLinka yet. Ask a vendor for this size, and a stand strong enough for the full weight (1 litre ≈ 1 kg)." />
            </Result>
          )}
        </>
      )}
    </CategoryShell>
  );
}
