import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Page, Heading, Glass, Field, Button, Txt } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { acceptLocalInvitation } from '../../services/familyService';

export default function JoinFamilyScreen({ navigation }) {
  const { theme: t } = useTheme();
  const { currentUser, setCurrentUser, refresh, finishOnboarding } = useApp();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const join = async () => {
    if (code.trim().length !== 8) return Alert.alert('Código incompleto', 'El código tiene 8 caracteres.');
    setBusy(true);
    try {
      const familyId = await acceptLocalInvitation({ code, userId: currentUser.id });
      const user = { ...currentUser, familyId };
      setCurrentUser(user);
      await refresh(user);
      finishOnboarding();
      Alert.alert('¡Listo!', 'Ahora formas parte del grupo familiar.');
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      Alert.alert('No se pudo unir', e.message);
      setBusy(false);
    }
  };

  return (
    <Page>
      <View style={{ paddingTop: 8 }}>
        <Heading title="Únete a tu familia" subtitle="Ingresa un código local de invitación de 8 caracteres." />
        <Glass>
          <Field label="Código de invitación" placeholder="AB12CD34" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" autoCorrect={false} maxLength={8} />
          <Txt size={11} color={t.muted} style={{ marginBottom: 16 }}>
            La invitación solo puede aceptarse en este mismo dispositivo y base de datos. No se sincroniza por internet.
          </Txt>
          <Button title="Unirse al grupo" loading={busy} onPress={join} />
        </Glass>
      </View>
    </Page>
  );
}
