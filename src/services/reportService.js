import { getDb } from '../data/database';

const VISIBLE = "(visibilidad='familiar' OR user_id=?)";

// Totales, gasto por categoría y evolución mensual (últimos 6 meses con datos).
export async function getStatistics(familyId, userId) {
  const db = await getDb();
  const base = `family_id=? AND deleted_at IS NULL AND ${VISIBLE}`;
  const sum = await db.getFirstAsync(
    `SELECT COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto_centavos ELSE 0 END),0) income,
            COALESCE(SUM(CASE WHEN tipo='gasto' THEN monto_centavos ELSE 0 END),0) expense
     FROM transactions WHERE ${base}`, [familyId, userId]);
  const cats = await db.getAllAsync(
    `SELECT c.nombre, c.color, COALESCE(SUM(t.monto_centavos),0) total
     FROM transactions t JOIN categories c ON c.id=t.categoria_id
     WHERE t.family_id=? AND t.tipo='gasto' AND t.deleted_at IS NULL AND (t.visibilidad='familiar' OR t.user_id=?)
     GROUP BY c.id, c.nombre ORDER BY total DESC LIMIT 6`, [familyId, userId]);
  const months = await db.getAllAsync(
    `SELECT substr(fecha,1,7) mes,
            COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto_centavos ELSE 0 END),0) income,
            COALESCE(SUM(CASE WHEN tipo='gasto' THEN monto_centavos ELSE 0 END),0) expense
     FROM transactions WHERE ${base} GROUP BY substr(fecha,1,7) ORDER BY mes DESC LIMIT 6`, [familyId, userId]);
  return {
    totals: { income: sum.income / 100, expense: sum.expense / 100 },
    categories: cats.map((c) => ({ ...c, total: c.total / 100 })),
    months: months.reverse().map((m) => ({ ...m, income: m.income / 100, expense: m.expense / 100 })),
  };
}

// month: 'YYYY-MM'
export async function getMonthlyReport(familyId, userId, month) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    `SELECT COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto_centavos ELSE 0 END),0) income,
            COALESCE(SUM(CASE WHEN tipo='gasto' THEN monto_centavos ELSE 0 END),0) expense,
            COUNT(*) count
     FROM transactions WHERE family_id=? AND substr(fecha,1,7)=? AND deleted_at IS NULL AND ${VISIBLE}`,
    [familyId, month, userId]);
  const cats = await db.getAllAsync(
    `SELECT c.nombre, SUM(t.monto_centavos) total
     FROM transactions t JOIN categories c ON c.id=t.categoria_id
     WHERE t.family_id=? AND substr(t.fecha,1,7)=? AND t.tipo='gasto' AND t.deleted_at IS NULL AND (t.visibilidad='familiar' OR t.user_id=?)
     GROUP BY c.id, c.nombre ORDER BY total DESC LIMIT 5`, [familyId, month, userId]);
  return {
    income: row.income / 100,
    expense: row.expense / 100,
    balance: (row.income - row.expense) / 100,
    count: row.count,
    categories: cats.map((x) => ({ ...x, total: x.total / 100 })),
  };
}
