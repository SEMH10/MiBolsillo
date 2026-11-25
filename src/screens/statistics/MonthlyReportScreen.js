import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Page, Heading, Glass, Txt, Section } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { getMonthlyReport } from '../../services/reportService';
import { currentMonthISO, money, addMonths } from '../../utils/format';

const label = (month) => {
  const [y, m] = month.split('-').map(Number);
  const text = new Date(y, m - 1, 1).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default function MonthlyReportScreen() {
  const { theme: t } = useTheme();
  const { currentUser } = useApp();
  const [month, setMonth] = useState(currentMonthISO());
  const [report, setReport] = useState({ income: 0, expense: 0, balance: 0, count: 0, categories: [] });

  useFocusEffect(useCallback(() => {
    let live = true;
    getMonthlyReport(currentUser.familyId, currentUser.id, month).then((r) => live && setReport(r)).catch((e) => console.warn('Reporte:', e));
    return () => { live = false; };
  }, [currentUser, month]));

  const shift = (n) => setMonth(addMonths(`${month}-01`, n).slice(0, 7));
  const isCurrent = month === currentMonthISO();

  return (
    <Page>
      <Heading title="Reporte mensual" subtitle={`Resumen de ${label(month)}.`} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <TouchableOpacity onPress={() => shift(-1)} accessibilityRole="button" accessibilityLabel="Mes anterior" style={{ padding: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={t.text} />
        </TouchableOpacity>
        <Txt weight="800">{label(month)}</Txt>
        <TouchableOpacity disabled={isCurrent} onPress={() => shift(1)} accessibilityRole="button" accessibilityLabel="Mes siguiente" style={{ padding: 8, opacity: isCurrent ? 0.3 : 1 }}>
          <MaterialCommunityIcons name="chevron-right" size={28} color={t.text} />
        </TouchableOpacity>
      </View>

      <Glass>
        {[['Ingresos', report.income, t.green], ['Gastos', report.expense, t.red], ['Balance', report.balance, report.balance < 0 ? t.red : t.primary]].map(([n, v, c], i) => (
          <View key={n} style={{ marginTop: i ? 14 : 0 }}>
            <Txt size={12} color={t.muted}>{n}</Txt>
            <Txt size={22} weight="900" color={c}>Bs {money(v)}</Txt>
          </View>
        ))}
        <Txt size={11} color={t.muted} style={{ marginTop: 14 }}>{report.count} {report.count === 1 ? 'movimiento' : 'movimientos'} en el mes</Txt>
      </Glass>

      <Section title="Categorías con mayor gasto" />
      <Glass>
        {report.categories.length ? report.categories.map((c, i) => (
          <Txt key={c.nombre} size={12} style={{ marginTop: i ? 10 : 0 }}>{i + 1}. {c.nombre} — Bs {money(c.total)}</Txt>
        )) : <Txt color={t.muted} size={12}>No hay gastos registrados este mes.</Txt>}
      </Glass>
    </Page>
  );
}
