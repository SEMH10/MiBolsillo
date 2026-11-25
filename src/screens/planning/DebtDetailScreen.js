import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Page, Heading, Glass, Txt, Button, Field, EmptyState, Section } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { getDebt, getDebtPayments, addDebtPayment } from '../../services/debtService';
import { money, formatDateEs } from '../../utils/format';

const STATE = { pendiente: 'Pendiente', parcial: 'Pago parcial', pagada: 'Pagada', cancelada: 'Cancelada' };

export default function DebtDetailScreen({ route }) {
  const { theme: t } = useTheme();
  const { currentUser, refresh } = useApp();
  const id = route.params?.id;
  const [debt, setDebt] = useState(undefined);
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return setDebt(null);
    setDebt(await getDebt(id));
    setPayments(await getDebtPayments(id));
  }, [id]);

  useFocusEffect(useCallback(() => { load().catch(() => setDebt(null)); }, [load]));

  const pay = async () => {
    setBusy(true);
    try {
      await addDebtPayment({ debtId: id, userId: currentUser.id, amount });
      setAmount('');
      await load();
      await refresh();
    } catch (e) {
      Alert.alert('No se pudo registrar el pago', e.message);
    } finally {
      setBusy(false);
    }
  };

  if (debt === undefined) return <Page><Txt color={t.muted}>Cargando…</Txt></Page>;
  if (!debt) return <Page><Heading title="Detalle de deuda" /><EmptyState title="Deuda no encontrada" /></Page>;

  const receivable = debt.tipo === 'por_cobrar';
  const open = debt.estado !== 'pagada' && debt.estado !== 'cancelada';
  return (
    <Page>
      <Heading title={debt.titulo} subtitle={`${debt.contraparte} · ${STATE[debt.estado] || debt.estado}`} />
      <Glass>
        <Txt color={t.muted} size={11}>SALDO PENDIENTE · {receivable ? 'POR COBRAR' : 'POR PAGAR'}</Txt>
        <Txt size={30} weight="900" color={receivable ? t.green : t.red} style={{ marginVertical: 8 }}>Bs {money(debt.saldo_pendiente_centavos / 100)}</Txt>
        <Txt size={12} color={t.muted}>Monto original: Bs {money(debt.monto_total_centavos / 100)}</Txt>
        <Txt size={12} color={t.muted} style={{ marginTop: 7 }}>Vencimiento: {debt.vencimiento ? formatDateEs(debt.vencimiento) : 'Sin fecha'}</Txt>
      </Glass>

      {open && (
        <Glass style={{ marginTop: 14 }}>
          <Txt weight="800" style={{ marginBottom: 10 }}>{receivable ? 'Registrar cobro' : 'Registrar abono'}</Txt>
          <Field label="Monto (Bs)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" />
          <Button title={receivable ? 'Registrar cobro' : 'Registrar pago'} loading={busy} onPress={pay} />
        </Glass>
      )}

      <Section title="Historial de pagos" />
      <Glass>
        {payments.length ? payments.map((p, i) => (
          <View key={p.id} style={{ paddingVertical: 9, borderBottomWidth: i === payments.length - 1 ? 0 : 0.5, borderColor: t.border }}>
            <Txt weight="700">Bs {money(p.monto_centavos / 100)}</Txt>
            <Txt size={11} color={t.muted}>{formatDateEs(p.fecha)}</Txt>
          </View>
        )) : <Txt color={t.muted} size={12}>Todavía no hay pagos.</Txt>}
      </Glass>
    </Page>
  );
}
