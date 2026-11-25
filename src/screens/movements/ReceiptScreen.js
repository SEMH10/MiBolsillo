import React, { useEffect, useState } from 'react';
import { View, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Page, Heading, Glass, Txt, Button } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { saveReceiptForTransaction, getReceipt, deleteReceipt } from '../../services/receiptService';

export default function ReceiptScreen({ route }) {
  const { theme: t } = useTheme();
  const transactionId = route.params?.transactionId;
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (transactionId) getReceipt(transactionId).then(setReceipt).catch((e) => Alert.alert('Error', e.message));
  }, [transactionId]);

  const pick = async (camera = false) => {
    if (!transactionId) return Alert.alert('Movimiento requerido', 'Abre esta pantalla desde el detalle de un movimiento.');
    try {
      const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return Alert.alert('Permiso requerido', 'Permite el acceso a la cámara o galería para adjuntar el comprobante.');
      const options = { mediaTypes: ['images'], quality: 0.8 };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      setBusy(true);
      const saved = await saveReceiptForTransaction(transactionId, result.assets[0].uri);
      setReceipt({ id: saved.id, local_uri: saved.uri, url: saved.uri });
    } catch (e) {
      Alert.alert('No se pudo adjuntar', e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    Alert.alert('Eliminar comprobante', '¿Quieres quitar la imagen adjunta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await deleteReceipt(transactionId); setReceipt(null); } catch (e) { Alert.alert('Error', e.message); } } },
    ]);

  return (
    <Page>
      <Heading title="Comprobante" subtitle="El archivo se copia al almacenamiento privado de la aplicación." />
      <Glass>
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          {receipt?.local_uri ? (
            <Image source={{ uri: receipt.local_uri }} style={{ width: 240, height: 280, borderRadius: 16 }} resizeMode="contain" />
          ) : (
            <>
              <MaterialCommunityIcons name="image-plus" size={54} color={t.primary} />
              <Txt weight="800" style={{ marginTop: 12 }}>Sin comprobante adjunto</Txt>
              <Txt size={11} color={t.muted} style={{ marginTop: 5, textAlign: 'center' }}>Adjunta una fotografía para respaldar el movimiento.</Txt>
            </>
          )}
        </View>
      </Glass>
      <View style={{ marginTop: 16 }}>
        <Button title={busy ? 'Guardando…' : 'Abrir cámara'} icon="camera-outline" loading={busy} onPress={() => pick(true)} />
        <Button title="Seleccionar de galería" icon="image-outline" variant="soft" style={{ marginTop: 10 }} disabled={busy} onPress={() => pick(false)} />
        {receipt ? <Button title="Eliminar comprobante" variant="outline" style={{ marginTop: 10 }} disabled={busy} onPress={remove} /> : null}
      </View>
    </Page>
  );
}
