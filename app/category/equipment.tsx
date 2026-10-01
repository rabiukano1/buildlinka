import { useState } from 'react';
import CategoryShell, { EmptyResult, Footnote, Label, Result, Row, Stepper, Wrap, formatPrice, numeric } from '../../components/CategoryShell';
import { Chip, Field } from '../../components/EngineerUI';
import { rental } from '../../lib/estimators';

const KINDS = ['Concrete mixer', 'Vibrator', 'Compactor', 'Scaffolding', 'Generator', 'Cutter / saw'];

export default function EquipmentScreen() {
  const [kind, setKind] = useState(KINDS[0]);
  const [days, setDays] = useState(5);
  const [dayRate, setDayRate] = useState('');
  const [weekRate, setWeekRate] = useState('');

  const est = rental(days, parseFloat(dayRate), parseFloat(weekRate));

  return (
    <CategoryShell
      title="Equipment"
      category="Equipment"
      emoji="🚜"
      heroTitle="Rent smart, not long"
      heroSub="Enter a vendor's day and week rates — we find the cheapest way to cover your job."
      trust={[['verified', 'Serviced kit'], ['local-shipping', 'Drop-off & pickup'], ['schedule', 'Daily or weekly']]}
      estimatorTitle="Rental planner"
      tips={[
        { icon: 'photo-camera', title: 'Photograph on delivery', text: 'Take photos of the machine when it arrives. It protects you from being charged for old damage.' },
        { icon: 'local-gas-station', title: 'Ask about fuel', text: 'Check whether fuel, oil and an operator are included. They can double the real cost.' },
        { icon: 'event-busy', title: 'Weekends count', text: 'Most vendors charge every calendar day the machine is on site, including Sundays.' },
      ]}
      hire={{ title: 'Need an operator?', sub: 'Hire skilled hands to run the equipment', icon: 'engineering' }}
    >
      <Label>What are you renting?</Label>
      <Wrap>{KINDS.map((k) => <Chip key={k} label={k} active={kind === k} onPress={() => setKind(k)} />)}</Wrap>
      <Row>
        <Field label="Day rate (₦)" placeholder="15000" keyboardType="number-pad" value={dayRate} onChangeText={numeric(setDayRate)} />
        <Field label="Week rate (₦, optional)" placeholder="75000" keyboardType="number-pad" value={weekRate} onChangeText={numeric(setWeekRate)} />
      </Row>
      <Stepper label="Days needed on site" value={days} onChange={setDays} min={1} max={90} />

      {est ? (
        <Result
          label={`${kind} for ${days} day${days > 1 ? 's' : ''}`}
          value={formatPrice(est.cost)}
          metrics={[
            [est.weeks ? `${est.weeks} wk${est.extraDays ? ` + ${est.extraDays} d` : ''}` : `${est.extraDays} days`, 'Book as'],
            [est.saved > 0 ? formatPrice(est.saved) : '—', 'Saved vs daily'],
          ]}
        >
          <Footnote>Excludes delivery, fuel, operator and deposit — confirm these with the vendor before booking.</Footnote>
        </Result>
      ) : (
        <EmptyResult text="Enter the vendor's day rate (and week rate if they have one)." />
      )}
    </CategoryShell>
  );
}
