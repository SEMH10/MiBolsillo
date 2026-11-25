import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Page, Heading, Glass, Txt, EmptyState, Button } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/notificationService';

const ICON = { presupuesto: 'chart-donut', meta: 'flag-checkered', deuda: 'cash-clock', familiar: 'account-group-outline', consejo: 'lightbulb-on-outline' };

export default function NotificationsScreen() {
  const { theme: t } = useTheme();
  const { currentUser, refreshUnread } = useApp();
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    setRows(await listNotifications(currentUser.id));
    await refreshUnread();
  }, [currentUser, refreshUnread]);

  useFocusEffect(useCallback(() => { load().catch((e) => console.warn('Notificaciones:', e)); }, [load]));

  const unread = rows.filter((r) => !r.leida).length;

  return (
    <Page>
      <Heading title="Notificaciones" subtitle="Alertas almacenadas localmente en este dispositivo." />
      {unread > 0 && (
        <Button title="Marcar todas como leídas" icon="check-all" variant="outline" style={{ marginBottom: 14 }}
          onPress={async () => { await markAllNotificationsRead(currentUser.id); await load(); }} />
      )}
      {rows.length === 0 ? (
        <EmptyState title="No tienes notificaciones" subtitle="Las alertas de presupuestos, metas y deudas aparecerán aquí cuando se generen." />
      ) : (
        <Glass>
          {rows.map((r, i) => (
            <TouchableOpacity key={r.id} onPress={async () => { await markNotificationRead(r.id, currentUser.id); await load(); }}
              style={{ flexDirection: 'row', paddingVertical: 14, borderBottomWidth: i === rows.length - 1 ? 0 : 0.7, borderColor: t.border }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: t.primary + '25', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <MaterialCommunityIcons name={ICON[r.tipo] || 'bell-outline'} size={21} color={t.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight={r.leida ? '600' : '800'}>{r.titulo}</Txt>
                <Txt size={12} color={t.muted} style={{ lineHeight: 18, marginTop: 4 }}>{r.mensaje}</Txt>
                <Txt size={10} color={t.muted} style={{ marginTop: 6 }}>{new Date(r.creada_en).toLocaleString('es-BO')}</Txt>
              </View>
              {!r.leida && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.primary, marginTop: 5 }} />}
            </TouchableOpacity>
          ))}
        </Glass>
      )}
    </Page>
  );
}
