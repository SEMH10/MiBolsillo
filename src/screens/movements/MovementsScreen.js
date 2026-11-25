import React, { useMemo, useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Page, Heading, Glass, Txt, Pill, PillRow, EmptyState } from '../../components/UI';
import TransactionRow from '../../components/TransactionRow';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

const TYPES = [['Todos', null], ['Gastos', 'expense'], ['Ingresos', 'income']];
const VISIBILITY = [['Todas', null], ['Familiar', 'Familiar'], ['Personal', 'Personal']];
const METHODS = [['Todos', null], ['Efectivo', 'efectivo'], ['QR', 'qr'], ['Transferencia', 'transferencia'], ['Tarjeta', 'tarjeta'], ['Otro', 'otro']];

export default function MovementsScreen({ navigation }) {
  const [type, setType] = useState(null);
  const [visibility, setVisibility] = useState(null);
  const [method, setMethod] = useState(null);
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { transactions } = useApp();
  const { theme: t } = useTheme();

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((item) =>
      (!type || item.type === type) &&
      (!visibility || item.visibility === visibility) &&
      (!method || item.method === method) &&
      (!q || (item.title || '').toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q))
    );
  }, [transactions, type, visibility, method, query]);

  const activeFilters = [visibility, method].filter(Boolean).length;

  const header = (
    <View>
      <Heading title="Movimientos" subtitle="Controla cada ingreso y gasto de tu familia." />
      <Glass padded={false} style={{ marginBottom: 15 }}>
        <View style={{ paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="magnify" size={20} color={t.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por descripción o categoría"
            placeholderTextColor={t.muted}
            style={{ padding: 14, color: t.text, flex: 1 }}
            accessibilityLabel="Buscar movimientos"
          />
          <TouchableOpacity onPress={() => setShowFilters((v) => !v)} accessibilityRole="button" accessibilityLabel="Mostrar u ocultar filtros">
            <MaterialCommunityIcons name="filter-variant" size={22} color={activeFilters ? t.primary : t.muted} />
          </TouchableOpacity>
        </View>
      </Glass>

      <PillRow>
        {TYPES.map(([label, value]) => <Pill key={label} label={label} active={type === value} onPress={() => setType(value)} />)}
      </PillRow>

      {showFilters ? (
        <Glass style={{ marginBottom: 12 }}>
          <Txt size={12} weight="800" style={{ marginBottom: 8 }}>Visibilidad</Txt>
          <PillRow>{VISIBILITY.map(([label, value]) => <Pill key={label} label={label} active={visibility === value} onPress={() => setVisibility(value)} />)}</PillRow>
          <Txt size={12} weight="800" style={{ marginVertical: 8 }}>Método de pago</Txt>
          <PillRow>{METHODS.map(([label, value]) => <Pill key={label} label={label} active={method === value} onPress={() => setMethod(value)} />)}</PillRow>
        </Glass>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
        <Txt size={12} color={t.muted} weight="700">MOVIMIENTOS</Txt>
        <Txt size={12} color={t.muted}>{data.length} {data.length === 1 ? 'registro' : 'registros'}</Txt>
      </View>
    </View>
  );

  return (
    <Page scroll={false} tabs>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="No se encontraron movimientos" subtitle="Prueba con otro filtro o registra uno nuevo con el botón +." />}
        renderItem={({ item }) => <TransactionRow item={item} onPress={() => navigation.navigate('TransactionDetail', { id: item.id })} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </Page>
  );
}
