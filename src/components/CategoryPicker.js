import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Pill, PillRow, Txt } from './UI';
import { useTheme } from '../context/ThemeContext';
import { listCategories } from '../services/categoryService';

// Selector de categorías leído de la base (sistema + personalizadas activas de la familia).
// type: 'income' | 'expense'.  allowNone: agrega la opción "Todas" (valor null).
export default function CategoryPicker({ familyId, type, value, onChange, allowNone = false, noneLabel = 'Todas' }) {
  const { theme: t } = useTheme();
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    setItems(null);
    listCategories(familyId, { type }).then((rows) => alive && setItems(rows)).catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, [familyId, type]);

  // Si la categoría elegida deja de existir (p. ej. al cambiar de gasto a ingreso) se selecciona la primera.
  useEffect(() => {
    if (!items || allowNone) return;
    if (items.length && !items.some((c) => c.id === value)) onChange(items[0].id);
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  if (items === null) return <Txt size={12} color={t.muted}>Cargando categorías…</Txt>;
  if (!items.length) return <Txt size={12} color={t.muted}>No hay categorías disponibles.</Txt>;
  return (
    <View>
      <PillRow>
        {allowNone ? <Pill label={noneLabel} active={!value} onPress={() => onChange(null)} /> : null}
        {items.map((c) => (
          <Pill key={c.id} label={c.nombre} active={value === c.id} onPress={() => onChange(c.id)} />
        ))}
      </PillRow>
    </View>
  );
}
