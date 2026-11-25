import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Txt } from '../components/UI';

// [etiqueta, ruta, ícono]
const LEFT = [['Inicio', 'Home', 'home-variant-outline'], ['Movimientos', 'Movements', 'swap-horizontal']];
const RIGHT = [['Estadísticas', 'Statistics', 'chart-box-outline'], ['Planificación', 'Planning', 'calendar-check-outline'], ['Más', 'More', 'dots-horizontal']];

export default function BottomBar({ state, navigation }) {
  const { theme: t } = useTheme();
  const insets = useSafeAreaInsets();

  const renderTab = ([label, route, icon]) => {
    const active = state.routes[state.index]?.name === route;
    const color = active ? t.primary : t.muted;
    return (
      <TouchableOpacity
        key={route}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => navigation.navigate(route)}
        style={{ alignItems: 'center', width: 58 }}
      >
        <MaterialCommunityIcons name={icon} size={22} color={color} />
        <Txt size={9} color={color} weight={active ? '800' : '500'} numberOfLines={1}>{label}</Txt>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{
        position: 'absolute', left: 12, right: 12, bottom: 12 + insets.bottom, height: 76, borderRadius: 25,
        backgroundColor: t.tab, borderWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-around', paddingHorizontal: 4, elevation: 14, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 15,
      }}
    >
      {LEFT.map(renderTab)}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Registrar movimiento"
        onPress={() => navigation.getParent()?.navigate('AddTransaction')}
        style={{ width: 55, height: 55, borderRadius: 20, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', marginTop: -28, borderWidth: 4, borderColor: t.bg1, elevation: 8 }}
      >
        <MaterialCommunityIcons name="plus" size={29} color="#063B37" />
      </TouchableOpacity>
      {RIGHT.map(renderTab)}
    </View>
  );
}
