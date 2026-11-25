import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Page, Glass, Txt, Button } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';

export default function WelcomeScreen({ navigation }) {
  const { theme: t } = useTheme();
  return (
    <Page>
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <View style={{ width: 76, height: 76, borderRadius: 25, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="wallet-bifold" size={40} color="#063B37" />
          </View>
          <Txt size={27} weight="900" style={{ marginTop: 14 }}>MiBolsillo</Txt>
          <Txt color={t.muted} size={12}>FINANZAS EN FAMILIA</Txt>
        </View>
        <Txt size={34} weight="800" style={{ lineHeight: 41 }}>Tu dinero en armonía.</Txt>
        <Txt color={t.muted} size={14} style={{ lineHeight: 22, marginTop: 12 }}>
          Organicemos juntos los ingresos, gastos y metas de tu familia para tomar mejores decisiones.
        </Txt>
        <Glass style={{ marginTop: 30, marginBottom: 35 }}>
          <Txt color={t.muted} size={12}>Ejemplo de balance familiar</Txt>
          <Txt size={29} weight="900" style={{ marginTop: 6 }}>Bs 4.280,50</Txt>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
            <Txt color={t.green} size={11} weight="700">↑ Ingresos Bs 9.450</Txt>
            <Txt color={t.red} size={11} weight="700">↓ Gastos Bs 5.169</Txt>
          </View>
        </Glass>
        <Button title="Crear una cuenta" onPress={() => navigation.navigate('Register')} />
        <Button title="Ya tengo cuenta · Iniciar sesión" variant="soft" style={{ marginTop: 12 }} onPress={() => navigation.navigate('Login')} />
        <Txt size={10} color={t.muted} style={{ textAlign: 'center', marginTop: 18 }}>
          Tus datos se guardan únicamente en este dispositivo.
        </Txt>
      </View>
    </Page>
  );
}
