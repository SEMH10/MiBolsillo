import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Page, Heading, Glass, Txt, Progress, Button, Field, EmptyState, Section } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { getGoal, getGoalContributions, addGoalContribution } from '../../services/goalService';
import { money, formatDateEs } from '../../utils/format';

export default function GoalDetailScreen({ route }) {
  const { theme: t } = useTheme();
  const { currentUser, refresh } = useApp();
  const id = route.params?.id;
  const [goal, setGoal] = useState(undefined);
  const [contributions, setContributions] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return setGoal(null);
    setGoal(await getGoal(id));
    setContributions(await getGoalContributions(id));
  }, [id]);

  useFocusEffect(useCallback(() => { load().catch(() => setGoal(null)); }, [load]));

  const add = async () => {
    setBusy(true);
    try {
      await addGoalContribution({ goalId: id, userId: currentUser.id, amount, description });
      setAmount(''); setDescription('');
      await load();
      await refresh(); // genera la alerta "Meta alcanzada" si corresponde
    } catch (e) {
      Alert.alert('No se pudo registrar el aporte', e.message);
    } finally {
      setBusy(false);
    }
  };

  if (goal === undefined) return <Page><Txt color={t.muted}>Cargando…</Txt></Page>;
  if (!goal) return <Page><Heading title="Detalle de meta" /><EmptyState title="Meta no encontrada" /></Page>;

  const remaining = Math.max(0, goal.target - goal.saved);
  return (
    <Page>
      <Heading title={goal.nombre} subtitle={goal.descripcion || 'Progreso y aportes de ahorro.'} />
      <Glass>
        <Txt color={t.muted} size={11}>PROGRESO ACTUAL</Txt>
        <Txt size={30} weight="900" color={t.purple} style={{ marginVertical: 8 }}>Bs {money(goal.saved)}</Txt>
        <Txt size={12} color={t.muted} style={{ marginBottom: 8 }}>Objetivo: Bs {money(goal.target)}{goal.fecha_limite ? ` · Hasta ${formatDateEs(goal.fecha_limite)}` : ''}</Txt>
        <Progress value={goal.progress} color={t.purple} />
        <Txt size={11} color={goal.estado === 'completada' ? t.green : t.muted} weight={goal.estado === 'completada' ? '800' : '400'} style={{ marginTop: 8 }}>
          {goal.estado === 'completada' ? '¡Meta alcanzada!' : `Faltan Bs ${money(remaining)} para alcanzar la meta.`}
        </Txt>
      </Glass>

      <Glass style={{ marginTop: 14 }}>
        <Txt weight="800" style={{ marginBottom: 10 }}>Registrar aportación</Txt>
        <Field label="Monto (Bs)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" />
        <Field label="Descripción (opcional)" value={description} onChangeText={setDescription} placeholder="Aporte mensual" />
        <Button title="Guardar aporte" loading={busy} onPress={add} />
      </Glass>

      <Section title="Historial de aportes" />
      <Glass>
        {contributions.length ? contributions.map((c, i) => (
          <View key={c.id} style={{ paddingVertical: 9, borderBottomWidth: i === contributions.length - 1 ? 0 : 0.5, borderColor: t.border }}>
            <Txt weight="700">Bs {money(c.monto_centavos / 100)}</Txt>
            <Txt size={11} color={t.muted}>{formatDateEs(c.fecha)} · {c.descripcion || 'Aporte'}</Txt>
          </View>
        )) : <Txt size={12} color={t.muted}>Todavía no hay aportes.</Txt>}
      </Glass>
    </Page>
  );
}
