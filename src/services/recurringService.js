import { getDb, newId, now } from '../data/database';
import { addDays, addMonths, isValidISODate, toCents, todayISO } from '../utils/format';

export function advanceDate(date, frequency) {
  if (frequency === 'semanal') return addDays(date, 7);
  if (frequency === 'quincenal') return addDays(date, 15);
  if (frequency === 'mensual') return addMonths(date, 1);
  return addMonths(date, 12);
}

// Genera los movimientos vencidos de cada regla activa. Idempotente: la clave
// (regla, fecha) es única, así que ejecutarlo varias veces no duplica nada.
// Si una regla es inválida (p. ej. su categoría fue desactivada) se omite sin romper la app.
export async function processDueRecurringRules() {
  const db = await getDb();
  const today = todayISO();
  const rules = await db.getAllAsync('SELECT * FROM recurring_rules WHERE activa=1 AND proxima_fecha<=? ORDER BY proxima_fecha', [today]);
  let generated = 0;
  const skipped = [];
  for (const rule of rules) {
    try {
      await db.withTransactionAsync(async () => {
        let date = rule.proxima_fecha;
        let count = 0;
        while (date <= today && count < 120) {
          const res = await db.runAsync(
            'INSERT OR IGNORE INTO transactions(id,family_id,user_id,categoria_id,tipo,monto_centavos,fecha,descripcion,visibilidad,metodo_pago,es_recurrente,creado_en,actualizado_en,actualizado_por,recurring_rule_id,recurring_occurrence_key) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?)',
            [`rec_${rule.id}_${date}`, rule.family_id, rule.user_id, rule.categoria_id, rule.tipo, rule.monto_centavos, date, rule.descripcion, rule.visibilidad, rule.metodo_pago, now(), now(), rule.user_id, rule.id, date]
          );
          generated += res.changes || 0;
          date = advanceDate(date, rule.frecuencia);
          count += 1;
        }
        await db.runAsync('UPDATE recurring_rules SET proxima_fecha=? WHERE id=?', [date, rule.id]);
      });
    } catch (e) {
      skipped.push({ id: rule.id, reason: e.message });
    }
  }
  return { processed: rules.length, generated, skipped };
}

export async function createRecurringRule(input) {
  const db = await getDb();
  const amount = toCents(input.amount);
  if (!input.categoryId) throw new Error('Selecciona una categoría válida.');
  const description = String(input.description || '').trim();
  if (!description) throw new Error('La descripción es obligatoria.');
  const nextDate = input.nextDate || todayISO();
  if (!isValidISODate(nextDate)) throw new Error('La fecha debe tener el formato AAAA-MM-DD.');
  const id = newId('rule');
  await db.runAsync(
    'INSERT INTO recurring_rules(id,family_id,user_id,tipo,categoria_id,monto_centavos,descripcion,visibilidad,metodo_pago,frecuencia,proxima_fecha,activa,creado_en) VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?)',
    [id, input.familyId, input.userId, input.type === 'income' ? 'ingreso' : 'gasto', input.categoryId, amount, description, input.visibility === 'Personal' ? 'personal' : 'familiar', (input.method || 'efectivo').toLowerCase(), input.frequency, nextDate, now()]
  );
  return id;
}

export async function getRecurringRules(familyId) {
  const db = await getDb();
  return db.getAllAsync('SELECT r.*,c.nombre categoria FROM recurring_rules r JOIN categories c ON c.id=r.categoria_id WHERE r.family_id=? ORDER BY r.proxima_fecha', [familyId]);
}

export async function toggleRecurringRule(id, active) {
  const db = await getDb();
  await db.runAsync('UPDATE recurring_rules SET activa=? WHERE id=?', [active ? 1 : 0, id]);
}
