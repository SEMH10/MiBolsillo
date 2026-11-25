import React, { useState } from 'react';
import { View } from 'react-native';
import { Page, Heading, Field, Button, Txt, Glass } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { isEmail } from '../../utils/format';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { theme: t } = useTheme();
  const { register } = useApp();

  const clear = (setter) => (value) => { setter(value); setError(''); };

  const handleRegister = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !pass || !confirmPass) return setError('Completa todos los campos para crear tu cuenta.');
    if (name.trim().length < 3) return setError('El nombre debe tener al menos 3 caracteres.');
    if (!isEmail(email)) return setError('Ingresa un correo electrónico válido.');
    if (pass.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (pass !== confirmPass) return setError('Las contraseñas no coinciden.');
    setBusy(true);
    try {
      // Se crea la cuenta, un grupo familiar propio y se entra a la app (ver RootNavigator → Onboarding).
      await register({ name, email, password: pass });
    } catch (e) {
      setError(e.message || 'No fue posible crear la cuenta.');
      setBusy(false);
    }
  };

  return (
    <Page>
      <View style={{ paddingTop: 8 }}>
        <Heading title="Crea tu cuenta" subtitle="Empieza a organizar tu dinero y el de tu familia." />
        <Glass>
          <Field label="Nombre completo" placeholder="Ej. María López" icon="account-outline" value={name} onChangeText={clear(setName)} autoCapitalize="words" autoComplete="name" />
          <Field label="Correo electrónico" placeholder="tu@correo.com" icon="email-outline" value={email} onChangeText={clear(setEmail)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
          <Field label="Contraseña" placeholder="Mínimo 8 caracteres" icon="lock-outline" value={pass} onChangeText={clear(setPass)} secureTextEntry autoCapitalize="none" autoCorrect={false} />
          <Field label="Confirmar contraseña" placeholder="Repite tu contraseña" icon="lock-check-outline" value={confirmPass} onChangeText={clear(setConfirmPass)} secureTextEntry autoCapitalize="none" autoCorrect={false} onSubmitEditing={handleRegister} />
          {error ? <Txt color={t.red} size={12} weight="700" style={{ marginBottom: 14 }}>{error}</Txt> : null}
          <Txt size={11} color={t.muted} style={{ marginBottom: 16 }}>
            Tu cuenta y tus datos se guardan solo en este dispositivo. Crear la cuenta puede tardar unos segundos.
          </Txt>
          <Button title={busy ? 'Creando cuenta…' : 'Crear cuenta'} loading={busy} onPress={handleRegister} />
        </Glass>
        <Button title="Ya tengo una cuenta" variant="soft" style={{ marginTop: 14 }} onPress={() => navigation.navigate('Login')} />
      </View>
    </Page>
  );
}
