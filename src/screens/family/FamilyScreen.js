import React, { useCallback, useState } from 'react';
import { View, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Page, Heading, Glass, Txt, Button, Section } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { getFamily, getFamilyMembers, createLocalInvitation } from '../../services/familyService';
import { initials } from '../../utils/format';

const ROLE = { admin: 'Administrador', integrante: 'Integrante', restringido: 'Restringido' };

export default function FamilyScreen({ navigation }) {
  const { theme: t } = useTheme();
  const { currentUser } = useApp();
  const [family, setFamily] = useState(null);
  const [people, setPeople] = useState([]);
  const [invite, setInvite] = useState(null);

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      const [f, m] = await Promise.all([getFamily(currentUser.familyId), getFamilyMembers(currentUser.familyId)]);
      if (alive) { setFamily(f); setPeople(m); }
    })().catch((e) => console.warn('Familia:', e));
    return () => { alive = false; };
  }, [currentUser]));

  const makeInvite = async () => {
    try {
      const value = await createLocalInvitation({ familyId: currentUser.familyId, userId: currentUser.id });
      setInvite(value);
    } catch (e) {
      Alert.alert('No se pudo crear', e.message);
    }
  };

  return (
    <Page>
      <Heading title="Grupo familiar" subtitle={family?.nombre || 'Tu espacio financiero familiar'} />
      <Glass>
        {people.map((p, i) => (
          <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: i === people.length - 1 ? 0 : 0.6, borderColor: t.border }}>
            <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: t.primary + '30', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Txt weight="800">{initials(p.nombre)}</Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="700">{p.nombre}{p.user_id === currentUser.id ? ' (tú)' : ''}</Txt>
              <Txt size={11} color={t.muted}>{p.email}</Txt>
            </View>
            <Txt size={11} color={t.green}>{ROLE[p.rol] || p.rol}</Txt>
          </View>
        ))}
        {people.length === 0 && <Txt color={t.muted}>No hay integrantes registrados.</Txt>}
      </Glass>

      <Section title="Invitaciones" />
      <Glass>
        <Txt weight="800">Invitación de un solo uso</Txt>
        <Txt size={11} color={t.muted} style={{ marginTop: 7 }}>
          Vale 48 horas y solo funciona en este dispositivo (los datos no se sincronizan con otros teléfonos).
        </Txt>
        {invite ? (
          <>
            <Txt size={26} weight="900" color={t.primary} style={{ letterSpacing: 4, marginTop: 12 }} selectable>{invite.code}</Txt>
            <Txt size={11} color={t.muted}>Válido hasta: {new Date(invite.expiresAt).toLocaleString('es-BO')}</Txt>
          </>
        ) : null}
        <Button title="Generar código local" icon="ticket-outline" style={{ marginTop: 15 }} onPress={makeInvite} />
      </Glass>
      <Button title="Tengo un código de invitación" variant="outline" style={{ marginTop: 12 }} onPress={() => navigation.navigate('JoinFamily')} />
    </Page>
  );
}
