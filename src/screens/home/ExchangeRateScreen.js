import React, { useCallback, useState } from 'react';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Page, Heading, Glass, Txt, Button, Field, Pill, PillRow, Section } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { getUsdToBobRate, convertAmount } from '../../services/exchangeRateService';
import { money } from '../../utils/format';

function formatUtc(value) {
  if (!value) return 'No disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ExchangeRateScreen() {
  const { theme: t } = useTheme();
  const { summary } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('bobToUsd');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getUsdToBobRate());
    } catch (e) {
      setError(e?.message || 'Ocurrió un error al consultar el tipo de cambio.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const balance = Number(summary?.balance || 0);
  const balanceUsd = data?.rate ? balance / data.rate : null;
  const converted = data ? convertAmount(amount, data.rate, direction) : null;

  return (
    <Page>
      <Heading
        title="Tipo de cambio"
        subtitle="Dólar estadounidense a bolivianos (referencia)."
        right={
          <TouchableOpacity onPress={load} disabled={loading} accessibilityRole="button" accessibilityLabel="Actualizar tipo de cambio">
            <MaterialCommunityIcons name="refresh" size={24} color={loading ? t.muted : t.primary} />
          </TouchableOpacity>
        }
      />

      {loading && !data ? (
        <Glass>
          <View style={{ alignItems: 'center', paddingVertical: 28 }}>
            <ActivityIndicator size="large" color={t.primary} />
            <Txt weight="800" style={{ marginTop: 14 }}>Consultando tipo de cambio…</Txt>
          </View>
        </Glass>
      ) : null}

      {error && !data ? (
        <Glass>
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <MaterialCommunityIcons name="wifi-off" size={38} color={t.red} />
            <Txt size={17} weight="900" style={{ marginTop: 10 }}>No se pudo consultar</Txt>
            <Txt size={12} color={t.muted} style={{ textAlign: 'center', marginTop: 6, marginBottom: 16 }}>{error}</Txt>
            <Button title="Reintentar" icon="refresh" onPress={load} loading={loading} style={{ alignSelf: 'stretch' }} />
          </View>
        </Glass>
      ) : null}

      {data ? (
        <>
          {data.fromCache ? (
            <Glass style={{ marginBottom: 12 }}>
              <Txt size={12} weight="800" color={t.amber}>Sin conexión: mostrando el último valor guardado.</Txt>
              <Txt size={11} color={t.muted} style={{ marginTop: 4 }}>{data.error}</Txt>
            </Glass>
          ) : null}

          <Glass>
            <Txt color={t.muted} size={12}>1 USD equivale a</Txt>
            <Txt size={34} weight="900" color={t.primary} style={{ marginTop: 8 }}>Bs {money(data.rate)}</Txt>
            <View style={{ height: 1, backgroundColor: t.border, marginVertical: 15 }} />
            <Txt color={t.muted} size={11}>Última actualización informada por la API</Txt>
            <Txt size={13} weight="700" style={{ marginTop: 5 }}>{formatUtc(data.lastUpdate)}</Txt>
            <Txt color={t.muted} size={11} style={{ marginTop: 12 }}>Próxima actualización estimada</Txt>
            <Txt size={13} weight="700" style={{ marginTop: 5 }}>{formatUtc(data.nextUpdate)}</Txt>
          </Glass>

          <Section title="Tu balance en dólares" />
          <Glass>
            <Txt color={t.muted} size={11}>Balance en bolivianos</Txt>
            <Txt size={22} weight="900" style={{ marginTop: 5 }} color={balance < 0 ? t.red : t.text}>Bs {money(balance)}</Txt>
            <View style={{ height: 1, backgroundColor: t.border, marginVertical: 14 }} />
            <Txt color={t.muted} size={11}>Equivalente aproximado</Txt>
            <Txt size={28} weight="900" color={t.green} style={{ marginTop: 5 }}>USD {money(balanceUsd)}</Txt>
          </Glass>

          <Section title="Convertidor" />
          <Glass>
            <PillRow>
              <Pill label="Bs → USD" active={direction === 'bobToUsd'} onPress={() => setDirection('bobToUsd')} />
              <Pill label="USD → Bs" active={direction === 'usdToBob'} onPress={() => setDirection('usdToBob')} />
            </PillRow>
            <Field label={direction === 'bobToUsd' ? 'Monto en bolivianos' : 'Monto en dólares'} placeholder="0,00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            {converted !== null ? (
              <Txt size={24} weight="900" color={t.primary}>
                {direction === 'bobToUsd' ? 'USD' : 'Bs'} {money(converted)}
              </Txt>
            ) : (
              <Txt size={12} color={t.muted}>Escribe un monto para ver la conversión.</Txt>
            )}
          </Glass>
        </>
      ) : null}

      {loading && data ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          <ActivityIndicator size="small" color={t.primary} />
          <Txt color={t.muted} size={11} style={{ marginLeft: 8 }}>Actualizando…</Txt>
        </View>
      ) : null}

      <Txt color={t.muted} size={10} style={{ marginTop: 18, textAlign: 'center' }}>
        Fuente: {data?.source || 'open.er-api.com'}. Tipo de cambio de referencia; puede diferir del que aplican bancos y casas de cambio.
      </Txt>
    </Page>
  );
}
