import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Page, Heading, Glass, Field, Button, Txt, Pill, PillRow } from '../../components/UI';
import CategoryPicker from '../../components/CategoryPicker';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { saveBudget } from '../../services/budgetService';

export default function BudgetScreen({ navigation }) {
  const { theme: t } = useTheme();
  const { currentUser } = useApp();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [period, setPeriod] = useState('mensual');
  const [personal, setPersonal] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await saveBudget({ familyId: currentUser.familyId, userId: currentUser.id, name, amount, categoryId, period, personal });
      navigation.goBack();
    } catch (e) {
      Alert.alert('No se pudo guardar', e.message);
      setBusy(false);
    }
  };

  return (
    <Page>
      <Heading title="Nuevo presupuesto" subtitle="Define un límite para controlar los gastos." />
      <Glass>
        <Field label="Nombre del presupuesto" placeholder="Ej. Alimentación mensual" value={name} onChangeText={setName} />
        <Field label="Monto máximo (Bs)" placeholder="0,00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />

        <Txt size={12} weight="700" style={{ marginBottom: 8 }}>Categoría</Txt>
        <CategoryPicker familyId={currentUser.familyId} type="expense" value={categoryId} onChange={setCategoryId} allowNone noneLabel="Todos los gastos" />

        <Txt size={12} weight="700" style={{ marginTop: 14, marginBottom: 8 }}>Periodo</Txt>
        <PillRow>
          <Pill label="Semanal" active={period === 'semanal'} onPress={() => setPeriod('semanal')} />
          <Pill label="Mensual" active={period === 'mensual'} onPress={() => setPeriod('mensual')} />
        </PillRow>
        <Txt size={11} color={t.muted} style={{ marginBottom: 12 }}>El presupuesto se renueva solo al terminar cada periodo.</Txt>

        <Txt size={12} weight="700" style={{ marginBottom: 8 }}>Alcance</Txt>
        <PillRow>
          <Pill label="Familiar" active={!personal} onPress={() => setPersonal(false)} />
          <Pill label="Personal" active={personal} onPress={() => setPersonal(true)} />
        </PillRow>
        <Txt size={11} color={t.muted}>
          {personal ? 'Cuenta solo tus gastos (familiares y personales). Las alertas son solo para ti.' : 'Cuenta los gastos familiares de todo el grupo. Todos reciben las alertas.'}
        </Txt>

        <Button title="Guardar presupuesto" loading={busy} onPress={save} style={{ marginTop: 16 }} />
      </Glass>
    </Page>
  );
}
