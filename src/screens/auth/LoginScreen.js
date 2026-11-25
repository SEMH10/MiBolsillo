import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Page, Heading, Field, Button, Txt, Glass } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { isEmail } from '../../utils/format';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { theme: t } = useTheme();
  const { login } = useApp();

  const handleLogin = async () => {
    setError('');
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) return setError('Completa todos los campos para continuar.');
    if (!isEmail(normalized)) return setError('Ingresa un correo electrónico válido.');
    setBusy(true);
    try {
      // Al iniciar sesión el navegador cambia solo a la app (ver RootNavigator).
      await login(normalized, password);
    } catch (e) {
      setError(e.message || 'No fue posible iniciar sesión.');
      setBusy(false);
    }
  };

  return (
    <Page>
      <View style={{ paddingTop: 16 }}>
        <Heading title="Bienvenido de nuevo" subtitle="Ingresa para revisar las finanzas de tu familia." />
        <Glass style={{ marginBottom: 22 }}>
          <Txt weight="800" size={18}>Iniciar sesión</Txt>
          <Txt color={t.muted} size={12} style={{ marginTop: 5, marginBottom: 18 }}>Accede de forma segura a MiBolsillo.</Txt>
          <Field
            label="Correo electrónico" placeholder="tu@correo.com" icon="email-outline"
            value={email} onChangeText={(v) => { setEmail(v); setError(''); }}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email"
          />
          <Field
            label="Contraseña" placeholder="Tu contraseña" icon="lock-outline"
            value={password} onChangeText={(v) => { setPassword(v); setError(''); }}
            secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="password"
            onSubmitEditing={handleLogin}
          />
          {error ? <Txt color={t.red} size={12} weight="700" style={{ marginBottom: 14 }}>{error}</Txt> : null}
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
            <Txt color={t.primary} weight="700" size={12}>¿Olvidaste tu contraseña?</Txt>
          </TouchableOpacity>
          <Button title={busy ? 'Verificando…' : 'Ingresar'} loading={busy} onPress={handleLogin} />
          <Button title="Crear una cuenta" variant="outline" style={{ marginTop: 12 }} onPress={() => navigation.navigate('Register')} />
        </Glass>
      </View>
    </Page>
  );
}
