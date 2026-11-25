import React, { useCallback, useState } from 'react';
import { View, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Page, Heading, Glass, Txt, Button, EmptyState } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { listFavorites, removeFavorite } from '../../services/favoriteService';

export default function FavoritesScreen({ navigation }) {
  const { theme: t } = useTheme();
  const { currentUser } = useApp();
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => setRows(await listFavorites(currentUser.id)), [currentUser]);
  useFocusEffect(useCallback(() => { load().catch((e) => console.warn('Favoritos:', e)); }, [load]));

  const confirmRemove = (r) =>
    Alert.alert('Quitar favorito', `¿Quitar "${r.nombre}" de tus favoritos?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: async () => { await removeFavorite(r.id, currentUser.id); await load(); } },
    ]);

  return (
    <Page>
      <Heading title="Movimientos frecuentes" subtitle="Plantillas guardadas para registrar más rápido." />
      {rows.length === 0 ? (
        <EmptyState title="Todavía no hay favoritos" subtitle="Abre un movimiento y toca «Guardar como favorito»." />
      ) : rows.map((r) => (
        <Glass key={r.id} style={{ marginBottom: 10 }}>
          <Txt weight="800">{r.nombre}</Txt>
          <Txt size={11} color={t.muted} style={{ marginTop: 4 }}>{r.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} · {r.categoria} · {r.metodo_pago}</Txt>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Button title="Usar" style={{ flex: 1 }} onPress={() => navigation.navigate('AddTransaction', { type: r.tipo === 'ingreso' ? 'income' : 'expense', favorite: r })} />
            <Button title="Quitar" variant="outline" style={{ flex: 1 }} onPress={() => confirmRemove(r)} />
          </View>
        </Glass>
      ))}
    </Page>
  );
}
