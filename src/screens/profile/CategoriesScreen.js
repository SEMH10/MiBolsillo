import React, { useCallback, useState } from 'react';
import { View, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Page, Heading, Glass, Txt, Button, Field, Pill, PillRow } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { listCategories, createCategory, toggleCategory } from '../../services/categoryService';

export default function CategoriesScreen() {
  const { currentUser } = useApp();
  const { theme: t } = useTheme();
  const [rows, setRows] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('gasto');

  const load = useCallback(async () => {
    setRows(await listCategories(currentUser.familyId, { onlyActive: false }));
  }, [currentUser]);

  useFocusEffect(useCallback(() => { load().catch((e) => console.warn('Categorías:', e)); }, [load]));

  const add = async () => {
    try {
      await createCategory({ familyId: currentUser.familyId, userId: currentUser.id, name, type });
      setName('');
      await load();
    } catch (e) {
      Alert.alert('No se pudo crear', e.message);
    }
  };

  const toggle = async (row) => {
    try {
      await toggleCategory({ row, familyId: currentUser.familyId, userId: currentUser.id });
      await load();
    } catch (e) {
      Alert.alert('No se pudo cambiar', e.message);
    }
  };

  return (
    <Page>
      <Heading title="Categorías" subtitle="Categorías del sistema y personalizadas." />
      <Glass>
        <Txt weight="800" style={{ marginBottom: 10 }}>Agregar categoría</Txt>
        <Field label="Nombre" placeholder="Ej. Mascotas" value={name} onChangeText={setName} />
        <PillRow>
          <Pill label="Gasto" active={type === 'gasto'} onPress={() => setType('gasto')} />
          <Pill label="Ingreso" active={type === 'ingreso'} onPress={() => setType('ingreso')} />
        </PillRow>
        <Button title="Guardar categoría" icon="plus" onPress={add} />
      </Glass>
      <Glass style={{ marginTop: 14 }}>
        {rows.map((r, i) => (
          <View key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i === rows.length - 1 ? 0 : 0.5, borderColor: t.border }}>
            <View style={{ flex: 1 }}>
              <Txt weight="700" color={r.activa ? t.text : t.muted}>{r.nombre}</Txt>
              <Txt size={10} color={t.muted}>{r.tipo === 'gasto' ? 'Gasto' : 'Ingreso'} · {r.family_id ? 'Personalizada' : 'Predeterminada'}</Txt>
            </View>
            {r.family_id ? (
              <Button title={r.activa ? 'Activa' : 'Inactiva'} variant="outline" style={{ height: 36, paddingHorizontal: 12 }} onPress={() => toggle(r)} />
            ) : null}
          </View>
        ))}
      </Glass>
    </Page>
  );
}
