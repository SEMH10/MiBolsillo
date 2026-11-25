import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Page, Heading, Glass, Field, Button, Txt, Pill, PillRow } from '../../components/UI';
import CategoryPicker from '../../components/CategoryPicker';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { obtenerTransaccionPorId } from '../../data/datos';
import { isValidISODate, toCents, todayISO } from '../../utils/format';

const METHODS = ['Efectivo', 'QR', 'Transferencia', 'Tarjeta', 'Otro'];
const methodLabel = (m) => METHODS.find((x) => x.toLowerCase() === String(m || '').toLowerCase()) || 'Efectivo';

// Sirve para crear, editar (params.transactionId) o crear desde un favorito (params.favorite).
export default function AddTransactionScreen({ navigation, route }) {
  const { transactionId, favorite } = route.params || {};
  const editing = !!transactionId;
  const { theme: t } = useTheme();
  const { currentUser, addTransaction, updateTransaction } = useApp();

  const [type, setType] = useState(route.params?.type || (favorite?.tipo === 'ingreso' ? 'income' : 'expense'));
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState(favorite?.nombre || '');
  const [categoryId, setCategoryId] = useState(favorite?.categoria_id || null);
  const [visibility, setVisibility] = useState(favorite?.visibilidad === 'personal' ? 'Personal' : 'Familiar');
  const [method, setMethod] = useState(methodLabel(favorite?.metodo_pago));
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(!editing);

  useEffect(() => {
    if (!editing) return;
    let alive = true;
    obtenerTransaccionPorId(transactionId).then((tx) => {
      if (!alive) return;
      if (tx) {
        setType(tx.type); setAmount(String(tx.amount)); setTitle(tx.title); setCategoryId(tx.categoryId);
        setVisibility(tx.visibility); setMethod(methodLabel(tx.method)); setDate(tx.date); setNote(tx.observation || '');
      }
      setReady(true);
    });
    return () => { alive = false; };
  }, [editing, transactionId]);

  const change = (setter, key) => (value) => { setter(value); if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined })); };

  const validate = () => {
    const next = {};
    try { toCents(amount); } catch (e) { next.amount = e.message; }
    if (title.trim().length < 3) next.title = 'La descripción debe tener al menos 3 caracteres.';
    if (!isValidISODate(date)) next.date = 'Usa el formato AAAA-MM-DD (ej. 2026-11-23).';
    if (!categoryId) next.category = 'Selecciona una categoría.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    const payload = { title: title.trim(), amount, categoryId, type, visibility, method, date, observation: note.trim() };
    try {
      if (editing) await updateTransaction(transactionId, payload);
      else await addTransaction(payload);
      navigation.goBack();
    } catch (e) {
      setErrors((cur) => ({ ...cur, form: e.message || 'No se pudo guardar el movimiento.' }));
      setBusy(false);
    }
  };

  if (!ready) return <Page><Txt color={t.muted}>Cargando movimiento…</Txt></Page>;

  return (
    <Page>
      <Heading title={editing ? 'Editar movimiento' : 'Nuevo movimiento'} subtitle="Registra un ingreso o gasto de forma sencilla." />

      <PillRow>
        <Pill label="Gasto" active={type === 'expense'} onPress={() => { setType('expense'); setCategoryId(null); }} />
        <Pill label="Ingreso" active={type === 'income'} onPress={() => { setType('income'); setCategoryId(null); }} />
      </PillRow>

      <Glass>
        <Txt color={t.muted} size={12} weight="700">MONTO DEL MOVIMIENTO</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Txt size={24} weight="800" style={{ marginRight: 8 }}>Bs</Txt>
          <View style={{ flex: 1 }}>
            <Field placeholder="0,00" value={amount} onChangeText={change(setAmount, 'amount')} keyboardType="decimal-pad" error={errors.amount} />
          </View>
        </View>

        <Field label="Descripción" placeholder="Ej. Compra del supermercado" value={title} onChangeText={change(setTitle, 'title')} error={errors.title} />
        <Field label="Fecha (AAAA-MM-DD)" placeholder="2026-11-23" value={date} onChangeText={change(setDate, 'date')} autoCorrect={false} maxLength={10} error={errors.date} />

        <Txt size={12} weight="700" style={{ marginBottom: 9 }}>Categoría</Txt>
        <CategoryPicker familyId={currentUser.familyId} type={type} value={categoryId} onChange={setCategoryId} />
        {errors.category ? <Txt color={t.red} size={12} style={{ marginTop: 4 }}>{errors.category}</Txt> : null}

        <Txt size={12} weight="700" style={{ marginTop: 14, marginBottom: 9 }}>Método de pago</Txt>
        <PillRow>{METHODS.map((m) => <Pill key={m} label={m} active={method === m} onPress={() => setMethod(m)} />)}</PillRow>

        <Field label="Nota (opcional)" placeholder="Detalle adicional" value={note} onChangeText={setNote} multiline />
      </Glass>

      <Txt size={12} weight="700" style={{ marginTop: 16, marginBottom: 9 }}>Visibilidad</Txt>
      <PillRow>
        <Pill label="Familiar" active={visibility === 'Familiar'} onPress={() => setVisibility('Familiar')} />
        <Pill label="Personal" active={visibility === 'Personal'} onPress={() => setVisibility('Personal')} />
      </PillRow>
      <Txt size={11} color={t.muted} style={{ marginBottom: 12 }}>
        {visibility === 'Personal' ? 'Solo tú verás este movimiento.' : 'Lo verán todos los integrantes del grupo.'}
      </Txt>

      {errors.form ? <Txt color={t.red} size={12} weight="700" style={{ marginBottom: 10 }}>{errors.form}</Txt> : null}
      <Button title={editing ? 'Guardar cambios' : 'Guardar movimiento'} loading={busy} onPress={save} />
    </Page>
  );
}
