import { getDb, newId, now } from '../data/database';
import { crearAporte, obtenerAportes } from '../data/aportes';
import { logAudit } from './auditService';
import { isValidISODate, toCents } from '../utils/format';

const decorate = (g) => ({
  ...g,
  target: g.monto_objetivo_centavos / 100,
  saved: g.monto_acumulado_centavos / 100,
  progress: Math.min(100, (g.monto_acumulado_centavos / g.monto_objetivo_centavos) * 100),
});

export async function saveGoal(input) {
  const db = await getDb();
  const amount = toCents(input.targetAmount, 'El monto objetivo');
  const name = String(input.name || '').trim();
  if (name.length < 2) throw new Error('Escribe un nombre para la meta.');
  if (input.dueDate && !isValidISODate(input.dueDate)) throw new Error('La fecha límite debe tener el formato AAAA-MM-DD.');
  if (input.id) {
    const before = await db.getFirstAsync('SELECT * FROM saving_goals WHERE id=?', [input.id]);
    await db.runAsync('UPDATE saving_goals SET nombre=?,descripcion=?,monto_objetivo_centavos=?,fecha_limite=?,actualizado_en=? WHERE id=?',
      [name, input.description || null, amount, input.dueDate || null, now(), input.id]);
    await logAudit({ familyId: before.family_id, userId: input.userId || before.user_id, entity: 'saving_goals', entityId: input.id, action: 'UPDATE', before, after: input });
    return input.id;
  }
  const id = newId('goal');
  await db.runAsync(
    "INSERT INTO saving_goals(id,family_id,user_id,nombre,descripcion,monto_objetivo_centavos,monto_acumulado_centavos,fecha_limite,estado,creado_en,actualizado_en) VALUES(?,?,?,?,?,?,0,?,'activa',?,?)",
    [id, input.familyId, input.userId || null, name, input.description || null, amount, input.dueDate || null, now(), now()]
  );
  await logAudit({ familyId: input.familyId, userId: input.actorUserId || input.userId, entity: 'saving_goals', entityId: id, action: 'CREATE', after: input });
  return id;
}

export async function getGoals(familyId) {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM saving_goals WHERE family_id=? ORDER BY creado_en DESC', [familyId]);
  return rows.map(decorate);
}

export async function getGoal(id) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM saving_goals WHERE id=?', [id]);
  return row ? decorate(row) : null;
}

export const getGoalContributions = (goalId) => obtenerAportes({ goalId });

// Registra el aporte; el acumulado lo recalcula un trigger de SQLite.
// Después se sincroniza el estado de la meta (activa <-> completada).
export async function addGoalContribution({ goalId, userId, amount, description }) {
  const saved = await crearAporte({ goalId, userId, amount, descripcion: description });
  const db = await getDb();
  const goal = await db.getFirstAsync('SELECT * FROM saving_goals WHERE id=?', [goalId]);
  if (goal) {
    const state = goal.monto_acumulado_centavos >= goal.monto_objetivo_centavos ? 'completada' : 'activa';
    if (goal.estado !== state && goal.estado !== 'cancelada') {
      await db.runAsync('UPDATE saving_goals SET estado=? WHERE id=?', [state, goalId]);
    }
  }
  return saved;
}
