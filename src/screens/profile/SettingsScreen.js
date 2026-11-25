import React, { useState } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Page, Heading, Glass, Txt, Field, Button } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { changePassword } from '../../services/authService';

export default function SettingsScreen() {
  const { theme: t, isDark, toggleTheme } = useTheme();
  const { currentUser } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await changePassword(currentUser.id, current, next);
      setCurrent(''); setNext('');
      Alert.alert('Contraseña actualizada', 'La nueva contraseña quedó guardada de forma segura en este dispositivo.');
    } catch (e) {
      Alert.alert('No se pudo cambiar', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <Heading title="Configuración" subtitle="Personaliza tu experiencia en MiBolsillo." />
      <Glass>
        <TouchableOpacity onPress={toggleTheme} accessibilityRole="switch" accessibilityState={{ checked: isDark }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 10 }}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={22} color={t.primary} />
          <View style={{ flex: 1, marginLeft: 13 }}>
            <Txt weight="700">Apariencia</Txt>
            <Txt size={11} color={t.muted}>{isDark ? 'Modo oscuro' : 'Modo claro'}</Txt>
          </View>
          <MaterialCommunityIcons name="toggle-switch" size={28} color={isDark ? t.primary : t.muted} style={{ transform: [{ scaleX: isDark ? 1 : -1 }] }} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
          <MaterialCommunityIcons name="shield-check-outline" size={22} color={t.primary} />
          <View style={{ marginLeft: 13 }}>
            <Txt weight="700">Privacidad y seguridad</Txt>
            <Txt size={11} color={t.muted}>Cambia la contraseña de tu cuenta local.</Txt>
          </View>
        </View>
        <Field label="Contraseña actual" value={current} onChangeText={setCurrent} secureTextEntry placeholder="Contraseña actual" autoCapitalize="none" autoCorrect={false} />
        <Field label="Nueva contraseña" value={next} onChangeText={setNext} secureTextEntry placeholder="Mínimo 8 caracteres" autoCapitalize="none" autoCorrect={false} />
        <Button title={busy ? 'Actualizando…' : 'Actualizar contraseña'} loading={busy} onPress={save} />
      </Glass>
      <Txt size={11} color={t.muted} style={{ marginTop: 14, lineHeight: 17 }}>
        La recuperación por correo no está disponible porque MiBolsillo funciona sin servidor ni servicio de correo externo.
      </Txt>
    </Page>
  );
}
