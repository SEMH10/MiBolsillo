import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Page, Heading, Glass, Txt, Section, EmptyState, Button } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { getStatistics } from '../../services/reportService';
import { money } from '../../utils/format';

export default function StatisticsScreen({ navigation }) {
  const { theme: t } = useTheme();
  const { currentUser } = useApp();
  const [data, setData] = useState({ totals: { income: 0, expense: 0 }, categories: [], months: [] });

  useFocusEffect(useCallback(() => {
    let live = true;
    getStatistics(currentUser.familyId, currentUser.id).then((d) => live && setData(d)).catch((e) => console.warn('Estadísticas:', e));
    return () => { live = false; };
  }, [currentUser]));

  const { totals, categories, months } = data;
  const total = categories.reduce((a, c) => a + c.total, 0);
  const max = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));

  return (
    <Page tabs>
      <Heading title="Estadísticas" subtitle="Resumen calculado con tus movimientos reales." />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        <Glass style={{ flex: 1 }}>
          <Txt color={t.muted} size={11}>Ingresos</Txt>
          <Txt size={19} weight="800" color={t.green}>Bs {money(totals.income)}</Txt>
        </Glass>
        <Glass style={{ flex: 1 }}>
          <Txt color={t.muted} size={11}>Gastos</Txt>
          <Txt size={19} weight="800" color={t.red}>Bs {money(totals.expense)}</Txt>
        </Glass>
      </View>

      <Section title="¿En qué gastamos?" />
      {categories.length === 0 ? <EmptyState title="Sin gastos registrados" /> : (
        <Glass>
          {categories.map((c) => {
            const pct = total ? (c.total / total) * 100 : 0;
            return (
              <View key={c.nombre} style={{ paddingVertical: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt size={12}>{c.nombre}</Txt>
                  <Txt size={12} weight="800">{Math.round(pct)}% · Bs {money(c.total)}</Txt>
                </View>
                <View style={{ height: 7, backgroundColor: t.track, borderRadius: 8, marginTop: 6, overflow: 'hidden' }}>
                  <View style={{ height: 7, width: `${pct}%`, backgroundColor: c.color || t.primary }} />
                </View>
              </View>
            );
          })}
        </Glass>
      )}

      <Section title="Ingresos vs. gastos por mes" />
      {months.length === 0 ? <EmptyState title="Todavía no hay datos mensuales" /> : (
        <Glass>
          <View style={{ height: 160, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {months.map((m) => (
              <View key={m.mes} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
                  <View style={{ width: 9, height: Math.max(2, (m.income / max) * 110), backgroundColor: t.primary, borderRadius: 4 }} />
                  <View style={{ width: 9, height: Math.max(2, (m.expense / max) * 110), backgroundColor: t.red, borderRadius: 4 }} />
                </View>
                <Txt size={9} color={t.muted} style={{ marginTop: 7 }}>{m.mes.slice(5)}/{m.mes.slice(2, 4)}</Txt>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 }}>
            <Txt size={10} color={t.primary}>■ Ingresos</Txt>
            <Txt size={10} color={t.red}>■ Gastos</Txt>
          </View>
        </Glass>
      )}

      <Button title="Ver reporte mensual" icon="chart-box-outline" variant="outline" style={{ marginTop: 20 }} onPress={() => navigation.navigate('MonthlyReport')} />
    </Page>
  );
}
