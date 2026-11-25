import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Page, Heading, Glass, Txt, Pill, PillRow, Section, Progress, Button, EmptyState } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { getBudgetsWithUsage } from '../../services/budgetService';
import { getGoals } from '../../services/goalService';
import { getDebts } from '../../services/debtService';
import { money, formatDateEs } from '../../utils/format';

const TABS = ['Presupuestos', 'Metas', 'Deudas'];
const DEBT_STATE = { pendiente: 'Pendiente', parcial: 'Pago parcial', pagada: 'Pagada', cancelada: 'Cancelada' };

export default function PlanningScreen({ navigation }) {
  const [tab, setTab] = useState('Presupuestos');
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const { theme: t } = useTheme();
  const { currentUser } = useApp();

  useFocusEffect(useCallback(() => {
    let live = true;
    (async () => {
      if (!currentUser?.familyId) return;
      const [b, g, d] = await Promise.all([getBudgetsWithUsage(currentUser.familyId), getGoals(currentUser.familyId), getDebts(currentUser.familyId)]);
      if (live) { setBudgets(b); setGoals(g); setDebts(d); }
    })().catch((e) => console.warn('Planificación:', e));
    return () => { live = false; };
  }, [currentUser]));

  return (
    <Page tabs>
      <Heading title="Planificación" subtitle="Organiza lo que viene para tu familia." />
      <PillRow>{TABS.map((x) => <Pill key={x} label={x} active={tab === x} onPress={() => setTab(x)} />)}</PillRow>

      {tab === 'Presupuestos' && (
        <>
          <Section title="Presupuestos activos" />
          {budgets.map((b) => {
            const over = b.rawPercentage >= 100;
            const warn = b.rawPercentage >= 80;
            return (
              <Glass key={b.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt weight="800" style={{ flex: 1 }}>{b.nombre}</Txt>
                  <Txt weight="800" color={over ? t.red : warn ? t.amber : t.text}>{Math.round(b.rawPercentage)}%</Txt>
                </View>
                <View style={{ marginTop: 8 }}><Progress value={b.percentage} color={over ? t.red : warn ? t.amber : t.primary} /></View>
                <Txt size={11} color={t.muted} style={{ marginTop: 8 }}>
                  Bs {money(b.spent)} usados de Bs {money(b.limit)} · {b.remaining >= 0 ? `Disponible Bs ${money(b.remaining)}` : `Excedido Bs ${money(-b.remaining)}`}
                </Txt>
                <Txt size={10} color={t.muted} style={{ marginTop: 4 }}>
                  {b.categoria_nombre || 'Todas las categorías'} · {b.user_id ? 'Personal' : 'Familiar'} · {formatDateEs(b.periodStart)} al {formatDateEs(b.periodEnd)}
                </Txt>
              </Glass>
            );
          })}
          {budgets.length === 0 && <EmptyState title="Sin presupuestos" subtitle="Crea un presupuesto para medir tus gastos reales." />}
          <Button title="Crear presupuesto" icon="plus" style={{ marginTop: 14 }} onPress={() => navigation.navigate('BudgetForm')} />
        </>
      )}

      {tab === 'Metas' && (
        <>
          <Section title="Metas de ahorro" />
          {goals.map((g) => (
            <TouchableOpacity key={g.id} activeOpacity={0.85} onPress={() => navigation.navigate('GoalDetail', { id: g.id })}>
              <Glass style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt weight="800" style={{ flex: 1 }}>{g.nombre}</Txt>
                  {g.estado === 'completada' ? <Txt size={11} weight="800" color={t.green}>Completada</Txt> : null}
                </View>
                <Txt color={t.muted} size={11} style={{ marginVertical: 7 }}>Bs {money(g.saved)} de Bs {money(g.target)}</Txt>
                <Progress value={g.progress} color={t.purple} />
                <Txt color={t.purple} size={11} weight="800" style={{ marginTop: 7 }}>{g.progress.toFixed(1)} % completado</Txt>
              </Glass>
            </TouchableOpacity>
          ))}
          {goals.length === 0 && <EmptyState title="Todavía no hay metas" subtitle="Crea una meta de ahorro y registra tus aportes." />}
          <Button title="Crear meta de ahorro" icon="plus" style={{ marginTop: 14 }} onPress={() => navigation.navigate('GoalForm')} />
        </>
      )}

      {tab === 'Deudas' && (
        <>
          <Section title="Deudas registradas" />
          {debts.map((d) => (
            <TouchableOpacity key={d.id} activeOpacity={0.85} onPress={() => navigation.navigate('DebtDetail', { id: d.id })}>
              <Glass style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt weight="800" style={{ flex: 1 }}>{d.titulo}</Txt>
                  <Txt weight="800" color={d.tipo === 'por_pagar' ? t.red : t.green}>{d.tipo === 'por_pagar' ? 'Por pagar' : 'Por cobrar'}</Txt>
                </View>
                <Txt size={12} color={t.muted} style={{ marginTop: 6 }}>{d.contraparte} · Pendiente Bs {money(d.saldo_pendiente_centavos / 100)}</Txt>
                <Txt size={11} color={t.muted} style={{ marginTop: 4 }}>
                  {DEBT_STATE[d.estado] || d.estado}{d.vencimiento ? ` · Vence ${formatDateEs(d.vencimiento)}` : ''}
                </Txt>
              </Glass>
            </TouchableOpacity>
          ))}
          {debts.length === 0 && <EmptyState title="Sin deudas registradas" subtitle="Registra lo que debes o lo que te deben." />}
          <Button title="Registrar deuda" icon="plus" style={{ marginTop: 14 }} onPress={() => navigation.navigate('DebtForm')} />
        </>
      )}

      <Button title="Movimientos recurrentes" icon="calendar-sync-outline" variant="outline" style={{ marginTop: 22 }} onPress={() => navigation.navigate('Recurring')} />
    </Page>
  );
}
