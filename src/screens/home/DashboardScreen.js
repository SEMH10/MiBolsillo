import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Page, Glass, Txt, Section, StatCard } from '../../components/UI';
import TransactionRow from '../../components/TransactionRow';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { money } from '../../utils/format';

export default function DashboardScreen({ navigation }) {
  const { transactions, summary, currentUser, unreadCount } = useApp();
  const { theme: t, toggleTheme, isDark } = useTheme();
  const firstName = (currentUser?.name?.trim() || 'Usuario').split(' ')[0];
  const recent = transactions.slice(0, 5);

  return (
    <Page tabs>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Txt size={12} color={t.muted}>MiBolsillo · Tu espacio financiero</Txt>
          <Txt size={24} weight="900">Hola, {firstName} 👋</Txt>
          <Txt size={11} color={t.muted} style={{ marginTop: 4 }}>{currentUser?.email || ''}</Txt>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          accessibilityRole="button"
          accessibilityLabel={unreadCount ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
          style={{ width: 43, height: 43, borderRadius: 15, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialCommunityIcons name={unreadCount ? 'bell-badge-outline' : 'bell-outline'} size={22} color={unreadCount ? t.primary : t.text} />
          {unreadCount ? (
            <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: t.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
              <Txt size={10} weight="800" color="#fff">{unreadCount > 9 ? '9+' : unreadCount}</Txt>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <Glass>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt color={t.muted} size={12}>Balance de movimientos</Txt>
          <TouchableOpacity onPress={toggleTheme} accessibilityRole="button" accessibilityLabel="Cambiar tema claro u oscuro">
            <MaterialCommunityIcons name={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'} size={19} color={t.muted} />
          </TouchableOpacity>
        </View>
        <Txt size={32} weight="900" style={{ marginTop: 8 }} color={summary.balance < 0 ? t.red : t.text}>Bs {money(summary.balance)}</Txt>
        <View style={{ flexDirection: 'row', marginTop: 18 }}>
          <View style={{ flex: 1 }}>
            <Txt size={11} color={t.muted}>Ingresos</Txt>
            <Txt color={t.green} weight="800" style={{ marginTop: 4 }}>Bs {money(summary.income)}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt size={11} color={t.muted}>Gastos</Txt>
            <Txt color={t.red} weight="800" style={{ marginTop: 4 }}>Bs {money(summary.expense)}</Txt>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: t.border, marginVertical: 14 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt size={11} color={t.muted}>Movimientos registrados</Txt>
          <Txt size={12} weight="800">{summary.count}</Txt>
        </View>
      </Glass>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <StatCard label="Ingresos" value={`Bs ${money(summary.income)}`} icon="trending-up" color={t.green} />
        <StatCard label="Gastos" value={`Bs ${money(summary.expense)}`} icon="trending-down" color={t.red} />
      </View>


      <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('ExchangeRate')} style={{ marginTop: 12 }} accessibilityRole="button">
        <Glass>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: t.primary + '25', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <MaterialCommunityIcons name="currency-usd" size={23} color={t.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="800">Tipo de cambio USD → BOB</Txt>
              <Txt size={11} color={t.muted} style={{ marginTop: 3 }}>Consulta el dólar y convierte tu balance</Txt>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={t.muted} />
          </View>
        </Glass>
      </TouchableOpacity>

      <Section title="Últimos movimientos" action="Ver todos" onAction={() => navigation.navigate('Movements')} />
      <Glass>
        {recent.length > 0 ? (
          recent.map((item) => (
            <TransactionRow key={item.id} item={item} onPress={() => navigation.navigate('TransactionDetail', { id: item.id })} />
          ))
        ) : (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Txt color={t.muted} style={{ textAlign: 'center' }}>Todavía no tienes movimientos. Toca el botón + para registrar el primero.</Txt>
          </View>
        )}
      </Glass>
    </Page>
  );
}
