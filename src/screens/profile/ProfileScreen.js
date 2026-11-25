import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Page, Heading, Glass, Field, Button, Txt } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { updateProfile } from '../../services/profileService';

export default function ProfileScreen() {
  const { theme: t } = useTheme();
  const { currentUser, setCurrentUser } = useApp();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const user = await updateProfile(currentUser.id, { name, email });
      setCurrentUser({ ...currentUser, ...user });
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron localmente.');
    } catch (e) {
      Alert.alert('No se pudo guardar', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <Heading title="Mi perfil" subtitle="Actualiza tu información personal." />
      <Glass>
        <Field label="Nombre completo" value={name} onChangeText={setName} autoCapitalize="words" />
        <Field label="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        <Button title="Guardar cambios" loading={busy} onPress={save} />
        <Txt size={11} style={{ marginTop: 12 }} color={t.muted}>Los cambios se guardan en la base de datos local del dispositivo.</Txt>
      </Glass>
    </Page>
  );
}
