import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Page, Heading, Glass, Field, Button, Txt, Pill, PillRow } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { saveDebt } from '../../services/debtService';

export default function DebtFormScreen({ navigation }) {
  const { currentUser } = useApp();
  const [title, setTitle] = useState('');
  const [total, setTotal] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState('por_pagar');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await saveDebt({ familyId: currentUser.familyId, userId: currentUser.id, title, total, counterparty, dueDate: dueDate.trim() || null, type });
      navigation.goBack();
    } catch (e) {
      Alert.alert('No se pudo guardar', e.message);
      setBusy(false);
    }
  };

  return (
    <Page>
      <Heading title="Registrar deuda" subtitle="Lleva el control de compromisos y cobros." />
      <Glass>
        <Field label="Título de la deuda" placeholder="Ej. Crédito del auto" value={title} onChangeText={setTitle} />
        <Field label="Monto total (Bs)" placeholder="0,00" keyboardType="decimal-pad" value={total} onChangeText={setTotal} />
        <Field label="Persona o entidad" placeholder="Nombre de la contraparte" value={counterparty} onChangeText={setCounterparty} />
        <Field label="Vencimiento (opcional, AAAA-MM-DD)" placeholder="2026-12-31" value={dueDate} onChangeText={setDueDate} maxLength={10} autoCorrect={false} />
        <Txt weight="700" size={12} style={{ marginBottom: 8 }}>Tipo</Txt>
        <PillRow>
          <Pill label="Por pagar" active={type === 'por_pagar'} onPress={() => setType('por_pagar')} />
          <Pill label="Por cobrar" active={type === 'por_cobrar'} onPress={() => setType('por_cobrar')} />
        </PillRow>
        <Button title="Guardar deuda" loading={busy} onPress={save} style={{ marginTop: 14 }} />
      </Glass>
    </Page>
  );
}
