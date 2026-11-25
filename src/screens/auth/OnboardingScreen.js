import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Page, Heading, Glass, Txt, Button } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

// Se muestra una sola vez, justo después de crear la cuenta.
export default function OnboardingScreen({ navigation }) {
  const { theme: t } = useTheme();
  const { finishOnboarding } = useApp();

  const skip = () => {
    finishOnboarding();
    navigation.replace('Main');
  };

  return (
    <Page>
      <View style={{ paddingTop: 8 }}>
        <Heading title="Tu familia, más organizada" subtitle="Tu cuenta ya tiene un grupo familiar. Elige cómo quieres seguir." />
        <Glass style={{ marginBottom: 14 }}>
          <MaterialCommunityIcons name="home-plus-outline" size={34} color={t.primary} />
          <Txt size={17} weight="800" style={{ marginTop: 12 }}>Personalizar mi grupo</Txt>
          <Txt color={t.muted} size={12} style={{ marginVertical: 8 }}>Serás administrador y podrás invitar a los integrantes de tu hogar.</Txt>
          <Button title="Nombrar mi grupo" onPress={() => navigation.navigate('CreateFamily')} />
        </Glass>
        <Glass style={{ marginBottom: 14 }}>
          <MaterialCommunityIcons name="account-multiple-plus-outline" size={34} color={t.purple} />
          <Txt size={17} weight="800" style={{ marginTop: 12 }}>Unirme con un código</Txt>
          <Txt color={t.muted} size={12} style={{ marginVertical: 8 }}>Si alguien de tu familia ya creó un grupo en este dispositivo, usa su invitación.</Txt>
          <Button title="Ingresar código" variant="soft" onPress={() => navigation.navigate('JoinFamily')} />
        </Glass>
        <Button title="Omitir por ahora" variant="outline" onPress={skip} />
      </View>
    </Page>
  );
}
