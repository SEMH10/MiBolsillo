import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Page, Heading, Glass, Field, Button } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { saveGoal } from '../../services/goalService';

export default function GoalFormScreen({ navigation }) {
  const { currentUser } = useApp();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await saveGoal({ familyId: currentUser.familyId, actorUserId: currentUser.id, name, targetAmount: target, dueDate: dueDate.trim() || null, description: description.trim() || null });
      navigation.goBack();
    } catch (e) {
      Alert.alert('No se pudo guardar', e.message);
      setBusy(false);
    }
  };

  return (
    <Page>
      <Heading title="Nueva meta de ahorro" subtitle="Define un objetivo para alcanzar en familia." />
      <Glass>
        <Field label="Nombre de la meta" placeholder="Ej. Fondo de emergencia" value={name} onChangeText={setName} />
        <Field label="Monto objetivo (Bs)" placeholder="0,00" keyboardType="decimal-pad" value={target} onChangeText={setTarget} />
        <Field label="Fecha límite (opcional, AAAA-MM-DD)" placeholder="2026-12-31" value={dueDate} onChangeText={setDueDate} maxLength={10} autoCorrect={false} />
        <Field label="Descripción (opcional)" placeholder="Describe tu objetivo" value={description} onChangeText={setDescription} />
        <Button title="Crear meta" loading={busy} onPress={save} />
      </Glass>
    </Page>
  );
}
