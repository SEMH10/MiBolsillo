import React from 'react';
import { View } from 'react-native';
import { Page, Heading, Glass, Button, Txt } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { theme: t } = useTheme();
  return (
    <Page>
      <View style={{ paddingTop: 8 }}>
        <Heading title="Recuperar contraseña" subtitle="MiBolsillo guarda los datos solo en este dispositivo." />
        <Glass>
          <Txt size={13} color={t.muted} style={{ lineHeight: 21 }}>
            Como esta versión no utiliza correo ni un servidor externo, no puede enviar enlaces de recuperación.
            Por seguridad, tampoco permite restablecer una contraseña sin conocer la actual.
          </Txt>
          <Button title="Volver al inicio de sesión" style={{ marginTop: 18 }} onPress={() => navigation.goBack()} />
        </Glass>
        <Txt color={t.muted} size={12} style={{ textAlign: 'center', marginTop: 18 }}>
          Si ya iniciaste sesión, puedes cambiar tu contraseña en Más → Configuración.
        </Txt>
      </View>
    </Page>
  );
}
