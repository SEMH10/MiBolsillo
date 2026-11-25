import { getDb, newId, now } from '../data/database';
import { logAudit } from './auditService';
import { addDays, addMonths, parseISODate, toCents, todayISO } from '../utils/format';

// Ventana (periodo vigente) de un presupuesto: se renueva solo cada semana o mes
// a partir de su fecha de inicio. Devuelve [inicio, fin) en formato YYYY-MM-DD.
export function budgetWindow(startISO, period, today = todayISO()) {
  if (today < startISO) return { start: startISO, end: period === 'semanal' ? addDays(startISO, 7) : addMonths(startISO, 1) };
  if (period === 'semanal') {
    const diffDays = Math.floor((parseISODate(today) - parseISODate(startISO)) / 86400000);
    const start = addDays(startISO, Math.floor(diffDays / 7) * 7);
    return { start, end: addDays(start, 7) };
  }
  const anchor = parseISODate(startISO).getDate();
  const a = parseISODate(startISO);
  const t = parseISODate(today);
  let months = (t.getFullYear() - a.getFullYear()) * 12 + (t.getMonth() - a.getMonth());
  let start = addMonths(startISO, months, anchor);
  if (start > today) { months -= 1; start = addMonths(startISO, months, anchor); }
  return { start, end: addMonths(startISO, months + 1, anchor) };
}

export async function saveBudget(input) {
  const db = await getDb();
  const amount = toCents(input.amount, 'El presupuesto');
  const name = String(input.name || '').trim();
  if (name.length < 2) throw new Error('Escribe un nombre para el presupuesto.');
  const row = {
    id: input.id || newId('budget'),
    family_id: input.familyId,
    // personal=true → presupuesto individual (cuenta también los gastos personales del autor).
    // personal=false → presupuesto familiar (cuenta solo los gastos familiares de todos).
    user_id: input.personal ? input.userId : null,
    categoria_id: input.categoryId || null,
    nombre: name,
    monto_centavos: amount,
    periodo: input.period || 'mensual',
    fecha_inicio: input.startDate || todayISO(),
    activo: 1,
    creado_en: now(),
    actualizado_en: now(),
  };
  if (input.id) {
    const before = await db.getFirstAsync('SELECT * FROM budgets WHERE id=?', [input.id]);
    await db.runAsync(
      'UPDATE budgets SET nombre=?,monto_centavos=?,categoria_id=?,periodo=?,fecha_inicio=?,actualizado_en=? WHERE id=?',
      [row.nombre, amount, row.categoria_id, row.periodo, row.fecha_inicio, now(), input.id]
    );
    await logAudit({ familyId: row.family_id || before.family_id, userId: input.userId, entity: 'budgets', entityId: input.id, action: 'UPDATE', before, after: row });
    return input.id;
  }
  await db.runAsync(
    'INSERT INTO budgets(id,family_id,user_id,categoria_id,nombre,monto_centavos,periodo,fecha_inicio,activo,creado_en,actualizado_en) VALUES(?,?,?,?,?,?,?,?,1,?,?)',
    [row.id, row.family_id, row.user_id, row.categoria_id, row.nombre, row.monto_centavos, row.periodo, row.fecha_inicio, row.creado_en, row.actualizado_en]
  );
  await logAudit({ familyId: row.family_id, userId: input.userId, entity: 'budgets', entityId: row.id, action: 'CREATE', after: row });
  return row.id;
}

export async function getBudgetsWithUsage(familyId) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT b.*, c.nombre AS categoria_nombre FROM budgets b LEFT JOIN categories c ON c.id=b.categoria_id
     WHERE b.family_id=? AND b.activo=1 ORDER BY b.creado_en DESC`,
    [familyId]
  );
  const result = [];
  for (const b of rows) {
    const { start, end } = budgetWindow(b.fecha_inicio, b.periodo);
    const where = ['family_id=?', "tipo='gasto'", 'deleted_at IS NULL', 'fecha>=?', 'fecha<?'];
    const args = [familyId, start, end];
    if (b.categoria_id) { where.push('categoria_id=?'); args.push(b.categoria_id); }
    if (b.user_id) { where.push('user_id=?'); args.push(b.user_id); }
    else where.push("visibilidad='familiar'");
    const spent = await db.getFirstAsync(`SELECT COALESCE(SUM(monto_centavos),0) total FROM transactions WHERE ${where.join(' AND ')}`, args);
    const used = spent.total / 100;
    const limit = b.monto_centavos / 100;
    result.push({
      ...b,
      limit,
      spent: used,
      remaining: limit - used,
      percentage: Math.min(100, (used / limit) * 100),
      rawPercentage: (used / limit) * 100,
      periodStart: start,
      periodEnd: end,
    });
  }
  return result;
}
