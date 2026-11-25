import { getDb, newId, now } from './database';
import { logAudit } from '../services/auditService';
import { iconFor } from '../utils/categoryIcons';
import { todayISO, toCents } from '../utils/format';

const METHODS = ['efectivo', 'qr', 'transferencia', 'tarjeta', 'otro'];

// Convierte una fila SQL en el objeto que usa la interfaz (incluye categoría, ícono y color).
const mapTx = (row) =>
  row && {
    ...row,
    amount: (row.monto_centavos || 0) / 100,
    title: row.descripcion,
    categoryId: row.categoria_id,
    familyId: row.family_id,
    userId: row.user_id,
    type: row.tipo === 'ingreso' ? 'income' : 'expense',
    visibility: row.visibilidad === 'personal' ? 'Personal' : 'Familiar',
    method: row.metodo_pago,
    date: row.fecha,
    observation: row.observacion,
    category: row.categoria_nombre || 'Sin categoría',
    icon: iconFor(row.categoria_icono),
    color: row.categoria_color || undefined,
    person: row.nombre_usuario || 'Tú',
  };

const SELECT_TX = `SELECT t.*, u.nombre AS nombre_usuario, c.nombre AS categoria_nombre, c.icono AS categoria_icono, c.color AS categoria_color
  FROM transactions t
  JOIN users u ON u.id = t.user_id
  LEFT JOIN categories c ON c.id = t.categoria_id`;

async function assertCanManage(db, tx, actorUserId) {
  if (!actorUserId) throw new Error('Usuario no autenticado.');
  const membership = await db.getFirstAsync(
    "SELECT rol FROM family_members WHERE family_id=? AND user_id=? AND estado='activo'",
    [tx.family_id, actorUserId]
  );
  if (!membership || membership.rol === 'restringido') throw new Error('No tienes permisos para modificar este movimiento.');
  if (tx.visibilidad === 'personal' && tx.user_id !== actorUserId) throw new Error('Los movimientos personales solo pueden ser modificados por su autor.');
  if (tx.user_id !== actorUserId && membership.rol !== 'admin') throw new Error('Solo el autor o un administrador puede modificar este movimiento.');
}

export async function obtenerTransacciones(filters = {}) {
  const db = await getDb();
  const clauses = ['t.deleted_at IS NULL'];
  const args = [];
  for (const [key, col] of [['userId', 't.user_id'], ['familyId', 't.family_id'], ['categoryId', 't.categoria_id'], ['type', 't.tipo']]) {
    if (filters[key]) {
      clauses.push(`${col}=?`);
      args.push(key === 'type' ? (filters[key] === 'income' ? 'ingreso' : 'gasto') : filters[key]);
    }
  }
  if (filters.familyId) {
    if (filters.viewerUserId) { clauses.push("(t.visibilidad='familiar' OR t.user_id=?)"); args.push(filters.viewerUserId); }
    else clauses.push("t.visibilidad='familiar'");
  } else if (filters.viewerUserId && !filters.userId) {
    clauses.push('t.user_id=?'); args.push(filters.viewerUserId);
  }
  if (filters.from) { clauses.push('t.fecha>=?'); args.push(filters.from); }
  if (filters.to) { clauses.push('t.fecha<=?'); args.push(filters.to); }
  if (filters.query) {
    const like = `%${filters.query.toLowerCase()}%`;
    clauses.push("(lower(t.descripcion) LIKE ? OR lower(COALESCE(t.observacion,'')) LIKE ?)");
    args.push(like, like);
  }
  const rows = await db.getAllAsync(`${SELECT_TX} WHERE ${clauses.join(' AND ')} ORDER BY t.fecha DESC, t.creado_en DESC`, args);
  return rows.map(mapTx);
}

export async function obtenerTransaccionPorId(id) {
  const db = await getDb();
  return mapTx(await db.getFirstAsync(`${SELECT_TX} WHERE t.id=? AND t.deleted_at IS NULL`, [id]));
}

export const obtenerTransaccionesPorUsuario = (userId) => obtenerTransacciones({ userId });
export const obtenerTransaccionesPorFamilia = (familyId, viewerUserId) => obtenerTransacciones({ familyId, viewerUserId });
export const obtenerTransaccionesPorCategoria = (categoryId) => obtenerTransacciones({ categoryId });
export const obtenerTransaccionesPorFecha = (from, to, filters = {}) => obtenerTransacciones({ ...filters, from, to });

const normalizeMethod = (value) => {
  const method = String(value || 'efectivo').toLowerCase();
  return METHODS.includes(method) ? method : 'otro';
};

export async function agregarTransaccion(input) {
  const db = await getDb();
  const id = input.id || newId('tx');
  const type = input.type === 'income' || input.tipo === 'ingreso' ? 'ingreso' : 'gasto';
  const cents = input.monto_centavos ? Number(input.monto_centavos) : toCents(input.amount);
  const stamp = now();
  const row = {
    id,
    family_id: input.familyId || input.family_id,
    user_id: input.userId || input.user_id,
    categoria_id: input.categoryId || input.categoria_id,
    tipo: type,
    monto_centavos: cents,
    fecha: input.date || input.fecha || todayISO(),
    descripcion: (input.title || input.descripcion || '').trim(),
    observacion: input.observation || input.observacion || null,
    visibilidad: String(input.visibility || input.visibilidad || 'Familiar').toLowerCase() === 'personal' ? 'personal' : 'familiar',
    metodo_pago: normalizeMethod(input.method || input.metodo_pago),
    es_recurrente: input.isRecurring ? 1 : 0,
    creado_en: stamp,
    actualizado_en: stamp,
    actualizado_por: input.userId || input.user_id || null,
    recurring_rule_id: input.recurringRuleId || null,
    recurring_occurrence_key: input.occurrenceKey || null,
  };
  if (!row.family_id || !row.user_id || !row.categoria_id) throw new Error('Faltan datos de usuario, familia o categoría.');
  if (!row.descripcion) throw new Error('La descripción es obligatoria.');
  const category = await db.getFirstAsync('SELECT tipo FROM categories WHERE id=? AND activa=1', [row.categoria_id]);
  if (!category || category.tipo !== row.tipo) throw new Error('La categoría no corresponde al tipo de movimiento.');
  const keys = Object.keys(row);
  await db.runAsync(`INSERT INTO transactions(${keys.join(',')}) VALUES(${keys.map(() => '?').join(',')})`, keys.map((k) => row[k]));
  await logAudit({ familyId: row.family_id, userId: row.user_id, entity: 'transactions', entityId: id, action: 'CREATE', after: row });
  return obtenerTransaccionPorId(id);
}

export async function modificarTransaccion(id, changes, actorUserId) {
  const db = await getDb();
  const current = await db.getFirstAsync('SELECT * FROM transactions WHERE id=? AND deleted_at IS NULL', [id]);
  if (!current) throw new Error('Movimiento no encontrado.');
  await assertCanManage(db, current, actorUserId);
  const patch = {};
  if (changes.title !== undefined) {
    patch.descripcion = String(changes.title).trim();
    if (!patch.descripcion) throw new Error('La descripción es obligatoria.');
  }
  if (changes.amount !== undefined) patch.monto_centavos = toCents(changes.amount);
  if (changes.categoryId !== undefined) patch.categoria_id = changes.categoryId;
  if (changes.type !== undefined) patch.tipo = changes.type === 'income' ? 'ingreso' : 'gasto';
  if (changes.visibility !== undefined) patch.visibilidad = String(changes.visibility).toLowerCase() === 'personal' ? 'personal' : 'familiar';
  if (changes.method !== undefined) patch.metodo_pago = normalizeMethod(changes.method);
  if (changes.date !== undefined) patch.fecha = changes.date;
  if (changes.observation !== undefined) patch.observacion = changes.observation || null;
  if (patch.categoria_id || patch.tipo) {
    const cat = await db.getFirstAsync('SELECT tipo FROM categories WHERE id=?', [patch.categoria_id || current.categoria_id]);
    if (!cat || cat.tipo !== (patch.tipo || current.tipo)) throw new Error('La categoría no corresponde al tipo de movimiento.');
  }
  const keys = Object.keys(patch);
  if (keys.length) {
    await db.runAsync(
      `UPDATE transactions SET ${keys.map((k) => `${k}=?`).join(',')},actualizado_por=?,actualizado_en=? WHERE id=?`,
      [...keys.map((k) => patch[k]), actorUserId, now(), id]
    );
    await logAudit({ familyId: current.family_id, userId: actorUserId, entity: 'transactions', entityId: id, action: 'UPDATE', before: current, after: patch });
  }
  return obtenerTransaccionPorId(id);
}

export async function eliminarTransaccion(id, actorUserId) {
  const db = await getDb();
  const before = await db.getFirstAsync('SELECT * FROM transactions WHERE id=? AND deleted_at IS NULL', [id]);
  if (!before) return false;
  await assertCanManage(db, before, actorUserId);
  await db.runAsync('UPDATE transactions SET deleted_at=?,actualizado_en=? WHERE id=?', [now(), now(), id]);
  await logAudit({ familyId: before.family_id, userId: actorUserId, entity: 'transactions', entityId: id, action: 'DELETE', before });
  return true;
}

export async function restaurarTransaccion(id, actorUserId) {
  const db = await getDb();
  const before = await db.getFirstAsync('SELECT * FROM transactions WHERE id=?', [id]);
  if (!before) return null;
  await assertCanManage(db, before, actorUserId);
  await db.runAsync('UPDATE transactions SET deleted_at=NULL,actualizado_en=? WHERE id=?', [now(), id]);
  await logAudit({ familyId: before.family_id, userId: actorUserId, entity: 'transactions', entityId: id, action: 'RESTORE', before });
  return obtenerTransaccionPorId(id);
}

export const buscarTransacciones = (query) => obtenerTransacciones({ query });

export async function obtenerResumenFinanciero(filters = {}) {
  const db = await getDb();
  const clauses = ['deleted_at IS NULL'];
  const args = [];
  if (filters.userId) { clauses.push('user_id=?'); args.push(filters.userId); }
  if (filters.familyId) { clauses.push('family_id=?'); args.push(filters.familyId); }
  if (filters.familyId) {
    if (filters.viewerUserId) { clauses.push("(visibilidad='familiar' OR user_id=?)"); args.push(filters.viewerUserId); }
    else clauses.push("visibilidad='familiar'");
  } else if (filters.viewerUserId && !filters.userId) {
    clauses.push('user_id=?'); args.push(filters.viewerUserId);
  }
  if (filters.from) { clauses.push('fecha>=?'); args.push(filters.from); }
  if (filters.to) { clauses.push('fecha<=?'); args.push(filters.to); }
  const r = await db.getFirstAsync(
    `SELECT COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto_centavos ELSE 0 END),0) ingresos,
            COALESCE(SUM(CASE WHEN tipo='gasto' THEN monto_centavos ELSE 0 END),0) gastos,
            COUNT(*) cantidad FROM transactions WHERE ${clauses.join(' AND ')}`,
    args
  );
  return { income: r.ingresos / 100, expense: r.gastos / 100, balance: (r.ingresos - r.gastos) / 100, count: r.cantidad };
}

export const obtenerTodasLasTransacciones = obtenerTransacciones;
