import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Page, Heading, Glass, Txt, Button, Field, Pill, PillRow, EmptyState } from '../../components/UI';
import CategoryPicker from '../../components/CategoryPicker';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { createRecurringRule, getRecurringRules, toggleRecurringRule, processDueRecurringRules } from '../../services/recurringService';
import { money, formatDateEs, todayISO } from '../../utils/format';

const FREQUENCIES = ['semanal', 'quincenal', 'mensual', 'anual'];
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function RecurringScreen() {
  const { theme: t } = useTheme();
  const { currentUser, refresh } = useApp();
  const [rows, setRows] = useState([]);
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [frequency, setFrequency] = useState('mensual');
  const [type, setType] = useState('expense');
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (currentUser?.familyId) setRows(await getRecurringRules(currentUser.familyId));
  }, [currentUser]);

  useFocusEffect(useCallback(() => { load().catch((e) => console.warn('Recurrentes:', e)); }, [load]));

  const save = async () => {
    setBusy(true);
    try {
      await createRecurringRule({ familyId: currentUser.familyId, userId: currentUser.id, type, categoryId, amount, description: name, frequency, nextDate: date });
      setShow(false); setName(''); setAmount(''); setDate(todayISO());
      await load();
    } catch (e) {
      Alert.alert('No se pudo crear', e.message);
    } finally {
      setBusy(false);
    }
  };

  const process = async () => {
    try {
      const r = await processDueRecurringRules();
      await refresh();
      await load();
      const extra = r.skipped.length ? `\nReglas omitidas por errores: ${r.skipped.length}.` : '';
      Alert.alert('Reglas procesadas', `Reglas revisadas: ${r.processed}. Movimientos nuevos: ${r.generated}.${extra}`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <Page>
      <Heading title="Movimientos recurrentes" subtitle="Genera movimientos al llegar su fecha, sin duplicarlos." />
      <Button title="Procesar reglas vencidas" icon="refresh" variant="outline" onPress={process} />

      {rows.length === 0 ? (
        <EmptyState title="Sin reglas recurrentes" subtitle="Útil para sueldos, alquiler o servicios que se repiten." />
      ) : rows.map((r) => (
        <Glass key={r.id} style={{ marginTop: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt weight="800" style={{ flex: 1 }}>{r.descripcion}</Txt>
            <Txt weight="700" color={r.activa ? t.green : t.muted}>{r.activa ? 'Activa' : 'Pausada'}</Txt>
          </View>
          <Txt size={11} color={t.muted} style={{ marginTop: 5 }}>
            {r.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} · Bs {money(r.monto_centavos / 100)} · {r.categoria} · {capitalize(r.frecuencia)}
          </Txt>
          <Txt size={11} color={t.muted} style={{ marginTop: 4 }}>Próxima fecha: {formatDateEs(r.proxima_fecha)}</Txt>
          <Button
            title={r.activa ? 'Pausar' : 'Reactivar'} variant="outline" style={{ marginTop: 10 }}
            onPress={async () => { try { await toggleRecurringRule(r.id, !r.activa); await load(); } catch (e) { Alert.alert('Error', e.message); } }}
          />
        </Glass>
      ))}

      <Button title={show ? 'Cancelar' : 'Crear regla recurrente'} icon={show ? 'close' : 'plus'} variant={show ? 'soft' : 'primary'} style={{ marginTop: 16 }} onPress={() => setShow((x) => !x)} />

      {show && (
        <Glass style={{ marginTop: 12 }}>
          <PillRow>
            <Pill label="Gasto" active={type === 'expense'} onPress={() => { setType('expense'); setCategoryId(null); }} />
            <Pill label="Ingreso" active={type === 'income'} onPress={() => { setType('income'); setCategoryId(null); }} />
          </PillRow>
          <Field label="Descripción" value={name} onChangeText={setName} placeholder="Ej. Servicio de internet" />
          <Field label="Monto (Bs)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" />
          <Txt size={12} weight="700" style={{ marginBottom: 8 }}>Categoría</Txt>
          <CategoryPicker familyId={currentUser.familyId} type={type} value={categoryId} onChange={setCategoryId} />
          <Txt size={12} weight="700" style={{ marginTop: 14, marginBottom: 8 }}>Frecuencia</Txt>
          <PillRow>{FREQUENCIES.map((x) => <Pill key={x} label={capitalize(x)} active={frequency === x} onPress={() => setFrequency(x)} />)}</PillRow>
          <Field label="Próxima fecha (AAAA-MM-DD)" value={date} onChangeText={setDate} maxLength={10} autoCorrect={false} />
          <Button title="Guardar regla" loading={busy} onPress={save} />
        </Glass>
      )}
    </Page>
  );
}
