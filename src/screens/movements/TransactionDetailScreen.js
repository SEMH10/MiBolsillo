import React, { useCallback, useState } from 'react';
import { View, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Page, Heading, Glass, Txt, Button, EmptyState } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { obtenerTransaccionPorId } from '../../data/datos';
import { addFavoriteFromTransaction } from '../../services/favoriteService';
import { money, formatDateEs } from '../../utils/format';

export default function TransactionDetailScreen({ route, navigation }) {
  const id = route.params?.id ?? route.params?.item?.id;
  const { theme: t } = useTheme();
  const { currentUser, deleteTransaction } = useApp();
  const [item, setItem] = useState(undefined); // undefined = cargando, null = no existe

  // Se vuelve a leer al enfocar: refleja cambios hechos al editar.
  useFocusEffect(useCallback(() => {
    let alive = true;
    obtenerTransaccionPorId(id).then((tx) => alive && setItem(tx || null)).catch(() => alive && setItem(null));
    return () => { alive = false; };
  }, [id]));

  const confirmDelete = () =>
    Alert.alert('Eliminar movimiento', 'Se ocultará este movimiento y quedará registrado en auditoría.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try { await deleteTransaction(id); navigation.goBack(); }
          catch (e) { Alert.alert('No se pudo eliminar', e.message); }
        },
      },
    ]);

  const saveFavorite = async () => {
    try { await addFavoriteFromTransaction(item, currentUser.id); Alert.alert('Guardado', 'El movimiento se guardó como favorito.'); }
    catch (e) { Alert.alert('No se pudo guardar', e.message); }
  };

  if (item === undefined) return <Page><Txt color={t.muted}>Cargando…</Txt></Page>;
  if (item === null) return <Page><Heading title="Detalle del movimiento" /><EmptyState title="Movimiento no encontrado" subtitle="Puede haber sido eliminado." /></Page>;

  const positive = item.type === 'income';
  const rows = [
    ['Categoría', item.category],
    ['Fecha', formatDateEs(item.date)],
    ['Método de pago', item.method],
    ['Registrado por', item.person],
    ['Visibilidad', item.visibility],
    ['Tipo', positive ? 'Ingreso' : 'Gasto'],
    ['Nota', item.observation],
  ];

  return (
    <Page>
      <Heading title="Detalle del movimiento" subtitle="Información del registro seleccionado." />
      <Glass>
        <Txt size={12} color={t.muted}>MONTO</Txt>
        <Txt size={30} weight="900" color={positive ? t.green : t.red} style={{ marginTop: 8 }}>
          {positive ? '+' : '−'} Bs {money(item.amount)}
        </Txt>
        <Txt size={19} weight="800" style={{ marginTop: 18 }}>{item.title || 'Sin título'}</Txt>
        <View style={{ height: 1, backgroundColor: t.border, marginVertical: 18 }} />
        {rows.map(([label, value]) => (
          <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
            <Txt color={t.muted} size={12}>{label}</Txt>
            <Txt weight="700" size={12} style={{ flexShrink: 1, textAlign: 'right', marginLeft: 16, textTransform: label === 'Método de pago' ? 'capitalize' : 'none' }}>{value || '—'}</Txt>
          </View>
        ))}
      </Glass>

      <Button title="Editar movimiento" icon="pencil-outline" style={{ marginTop: 14 }} onPress={() => navigation.navigate('AddTransaction', { transactionId: item.id })} />
      <Button title="Ver / adjuntar comprobante" icon="paperclip" variant="outline" style={{ marginTop: 10 }} onPress={() => navigation.navigate('Receipt', { transactionId: item.id })} />
      <Button title="Guardar como favorito" icon="star-outline" variant="soft" style={{ marginTop: 10 }} onPress={saveFavorite} />
      <Button title="Eliminar movimiento" icon="trash-can-outline" variant="outline" style={{ marginTop: 10 }} onPress={confirmDelete} />
    </Page>
  );
}
