import { getDb, newId, now } from '../data/database';
import { getBudgetsWithUsage } from './budgetService';
import { todayISO, addDays, formatDateEs } from '../utils/format';

async function notify(db, { userId, familyId, tipo, titulo, mensaje, clave }) {
  await db.runAsync(
    'INSERT OR IGNORE INTO notifications(id,user_id,family_id,tipo,titulo,mensaje,leida,clave_unica,creada_en) VALUES(?,?,?,?,?,?,0,?,?)',
    [newId('notif'), userId, familyId, tipo, titulo, mensaje, clave, now()]
  );
}

// Genera alertas locales sin duplicarlas (clave_unica). Se llama al refrescar datos.
export async function checkLocalAlerts(familyId, userId) {
  if (!familyId || !userId) return;
  const db = await getDb();

  const budgets = await getBudgetsWithUsage(familyId);
  for (const b of budgets) {
    if ((!b.user_id || b.user_id === userId) && b.rawPercentage >= 80) {
      const over = b.rawPercentage >= 100;
      await notify(db, {
        userId, familyId, tipo: 'presupuesto',
        titulo: over ? 'Presupuesto superado' : 'Presupuesto cerca del límite',
        mensaje: `${b.nombre}: se utilizó ${Math.round(b.rawPercentage)} % del presupuesto.`,
        // La clave incluye el periodo vigente: la alerta puede volver a aparecer en el siguiente periodo.
        clave: `budget:${b.id}:${b.periodStart}:${over ? 'over' : 'warn'}:${userId}`,
      });
    }
  }

  const goals = await db.getAllAsync(
    "SELECT id,nombre,monto_objetivo_centavos,monto_acumulado_centavos FROM saving_goals WHERE family_id=? AND estado IN ('activa','completada') AND (user_id IS NULL OR user_id=?)",
    [familyId, userId]
  );
  for (const g of goals) {
    if (g.monto_acumulado_centavos >= g.monto_objetivo_centavos) {
      await notify(db, { userId, familyId, tipo: 'meta', titulo: '¡Meta alcanzada!', mensaje: `Has completado la meta ${g.nombre}.`, clave: `goal:${g.id}:completed:${userId}` });
    }
  }

  const limit = addDays(todayISO(), 3);
  const due = await db.getAllAsync(
    "SELECT id,titulo,vencimiento FROM debts WHERE family_id=? AND deleted_at IS NULL AND estado IN ('pendiente','parcial') AND vencimiento IS NOT NULL AND vencimiento<=?",
    [familyId, limit]
  );
  for (const d of due) {
    await notify(db, { userId, familyId, tipo: 'deuda', titulo: 'Vencimiento de deuda', mensaje: `${d.titulo} vence el ${formatDateEs(d.vencimiento)}.`, clave: `debt:${d.id}:${d.vencimiento}:${userId}` });
  }
}

export async function listNotifications(userId) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM notifications WHERE user_id=? ORDER BY creada_en DESC', [userId]);
}

export async function countUnread(userId) {
  const db = await getDb();
  const r = await db.getFirstAsync('SELECT COUNT(*) n FROM notifications WHERE user_id=? AND leida=0', [userId]);
  return r?.n || 0;
}

export async function markNotificationRead(id, userId) {
  const db = await getDb();
  await db.runAsync('UPDATE notifications SET leida=1 WHERE id=? AND user_id=?', [id, userId]);
}

export async function markAllNotificationsRead(userId) {
  const db = await getDb();
  await db.runAsync('UPDATE notifications SET leida=1 WHERE user_id=? AND leida=0', [userId]);
}
