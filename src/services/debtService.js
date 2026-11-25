import { getDb, newId, now } from '../data/database';
import { crearPagoDeuda, obtenerPagosDeuda } from '../data/pagosDeudas';
import { logAudit } from './auditService';
import { isValidISODate, toCents, todayISO } from '../utils/format';

export async function saveDebt(input) {
  const db = await getDb();
  const total = toCents(input.total, 'La deuda');
  const title = String(input.title || '').trim();
  const counterparty = String(input.counterparty || '').trim();
  if (!title) throw new Error('Escribe un título para la deuda.');
  if (!counterparty) throw new Error('Indica la persona o entidad.');
  if (input.dueDate && !isValidISODate(input.dueDate)) throw new Error('La fecha de vencimiento debe tener el formato AAAA-MM-DD.');
  if (input.id) {
    const before = await db.getFirstAsync('SELECT * FROM debts WHERE id=?', [input.id]);
    await db.runAsync('UPDATE debts SET titulo=?,contraparte=?,vencimiento=?,observaciones=?,actualizado_en=? WHERE id=?',
      [title, counterparty, input.dueDate || null, input.notes || null, now(), input.id]);
    await logAudit({ familyId: before.family_id, userId: input.userId || before.creado_por, entity: 'debts', entityId: input.id, action: 'UPDATE', before, after: input });
    return input.id;
  }
  const id = newId('debt');
  await db.runAsync(
    "INSERT INTO debts(id,family_id,creado_por,responsable_id,titulo,tipo,contraparte,monto_total_centavos,saldo_pendiente_centavos,fecha_creacion,vencimiento,estado,observaciones,actualizado_en) VALUES(?,?,?,?,?,?,?,?,?,?,?,'pendiente',?,?)",
    [id, input.familyId, input.userId, input.responsibleId || input.userId, title, input.type || 'por_pagar', counterparty, total, total, todayISO(), input.dueDate || null, input.notes || null, now()]
  );
  await logAudit({ familyId: input.familyId, userId: input.userId, entity: 'debts', entityId: id, action: 'CREATE', after: input });
  return id;
}

export async function getDebts(familyId) {
  const db = await getDb();
  return db.getAllAsync(
    "SELECT * FROM debts WHERE family_id=? AND deleted_at IS NULL ORDER BY CASE estado WHEN 'pagada' THEN 1 WHEN 'cancelada' THEN 1 ELSE 0 END, vencimiento IS NULL, vencimiento",
    [familyId]
  );
}

export async function getDebt(id) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM debts WHERE id=? AND deleted_at IS NULL', [id]);
}

export const getDebtPayments = (debtId) => obtenerPagosDeuda(debtId);

export async function addDebtPayment({ debtId, userId, amount }) {
  const cents = toCents(amount, 'El pago');
  const debt = await getDebt(debtId);
  if (!debt) throw new Error('La deuda no existe.');
  if (debt.estado === 'pagada' || debt.estado === 'cancelada') throw new Error('Esta deuda ya no admite pagos.');
  if (cents > debt.saldo_pendiente_centavos) {
    throw new Error(`El pago supera el saldo pendiente (Bs ${(debt.saldo_pendiente_centavos / 100).toFixed(2)}).`);
  }
  return crearPagoDeuda({ debtId, userId, amount: cents / 100 });
}
