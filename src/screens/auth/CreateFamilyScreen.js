import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Page, Heading, Glass, Field, Button, Txt } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { renameFamily } from '../../services/familyService';

export default function CreateFamilyScreen({ navigation }) {
  const { theme: t } = useTheme();
  const { currentUser, finishOnboarding } = useApp();
  const [name, setName] = useState(`Familia de ${(currentUser?.name || 'MiBolsillo').split(' ')[0]}`);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await renameFamily(currentUser.familyId, currentUser.id, name);
      finishOnboarding();
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      Alert.alert('No se pudo guardar', e.message);
      setBusy(false);
    }
  };

  return (
    <Page>
      <View style={{ paddingTop: 8 }}>
        <Heading title="Configura tu grupo familiar" subtitle="Tu cuenta ya tiene un espacio familiar local. Puedes personalizar su nombre." />
        <Glass>
          <Field label="Nombre del grupo" value={name} onChangeText={setName} icon="home-heart" />
          <Txt size={12} weight="700" style={{ marginBottom: 8 }}>Moneda principal</Txt>
          <View style={{ padding: 14, borderRadius: 14, backgroundColor: t.primary + '1F', marginBottom: 18 }}>
            <Txt weight="800">Bolivianos (Bs)</Txt>
            <Txt size={11} color={t.muted}>Moneda predeterminada para tu familia</Txt>
          </View>
          <Button title="Guardar grupo familiar" loading={busy} onPress={save} />
        </Glass>
      </View>
    </Page>
  );
}
