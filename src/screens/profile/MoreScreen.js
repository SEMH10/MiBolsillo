import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Page, Heading, Glass, Txt, Button } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { initials } from '../../utils/format';

const ITEMS = [
  ['account-outline', 'Mi perfil', 'Datos personales', 'Profile'],
  ['account-group-outline', 'Grupo familiar', 'Integrantes e invitaciones', 'Family'],
  ['bell-outline', 'Notificaciones', 'Alertas y recordatorios', 'Notifications'],
  ['calendar-sync-outline', 'Movimientos recurrentes', 'Ingresos y gastos que se repiten', 'Recurring'],
  ['currency-usd', 'Tipo de cambio', 'Dólar a bolivianos (requiere internet)', 'ExchangeRate'],
  ['shape-outline', 'Categorías', 'Administra tus categorías', 'Categories'],
  ['star-outline', 'Movimientos frecuentes', 'Tus registros favoritos', 'Favorites'],
  ['tune-variant', 'Configuración', 'Apariencia y contraseña', 'Settings'],
];

export default function MoreScreen({ navigation }) {
  const { theme: t } = useTheme();
  const { currentUser, logout } = useApp();

  return (
    <Page tabs>
      <Heading title="Más" subtitle="Administra tu cuenta y tu familia." />
      <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Profile')}>
        <Glass style={{ marginBottom: 15 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', marginRight: 13 }}>
              <Txt weight="900" size={18} color="#063B37">{initials(currentUser?.name)}</Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={16} weight="800">{currentUser?.name || 'Usuario'}</Txt>
              <Txt size={11} color={t.muted}>{currentUser?.email || ''}</Txt>
              <Txt size={10} color={t.green} style={{ marginTop: 4 }}>● Cuenta local</Txt>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={t.muted} />
          </View>
        </Glass>
      </TouchableOpacity>

      <Glass>
        {ITEMS.map(([icon, title, sub, route], i) => (
          <TouchableOpacity key={route} onPress={() => navigation.navigate(route)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: i === ITEMS.length - 1 ? 0 : 0.6, borderColor: t.border }}>
            <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: t.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <MaterialCommunityIcons name={icon} size={20} color={t.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="700">{title}</Txt>
              <Txt size={10} color={t.muted} style={{ marginTop: 3 }}>{sub}</Txt>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={t.muted} />
          </TouchableOpacity>
        ))}
      </Glass>

      {/* Al cerrar sesión el navegador vuelve solo a Bienvenida (ver RootNavigator). */}
      <Button title="Cerrar sesión" variant="outline" icon="logout" style={{ marginTop: 18 }} onPress={logout} />
      <Txt color={t.muted} size={10} style={{ textAlign: 'center', marginTop: 18 }}>MiBolsillo v2.0.0 · Tus finanzas en armonía</Txt>
    </Page>
  );
}
