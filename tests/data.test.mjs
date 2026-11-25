import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDb } from '../src/data/database.js';
import { registerUser, loginUser, restoreSession, logoutUser } from '../src/services/authService.js';
import { agregarTransaccion, obtenerTransacciones, obtenerTransaccionPorId, modificarTransaccion, eliminarTransaccion, obtenerResumenFinanciero } from '../src/data/datos.js';
import { saveBudget, getBudgetsWithUsage, budgetWindow } from '../src/services/budgetService.js';
import { saveGoal, getGoal, addGoalContribution } from '../src/services/goalService.js';
import { saveDebt, getDebt, addDebtPayment } from '../src/services/debtService.js';
import { createRecurringRule, processDueRecurringRules, advanceDate } from '../src/services/recurringService.js';
import { checkLocalAlerts, listNotifications, countUnread, markAllNotificationsRead } from '../src/services/notificationService.js';
import { listCategories, createCategory } from '../src/services/categoryService.js';
import { createLocalInvitation, acceptLocalInvitation } from '../src/services/familyService.js';
import { getStatistics, getMonthlyReport } from '../src/services/reportService.js';
import { toCents, isValidISODate, todayISO, addMonths } from '../src/utils/format.js';

const state = {};
const catId = async (nombre) => (await (await getDb()).getFirstAsync('SELECT id FROM categories WHERE nombre=?', [nombre])).id;

test('utilidades: montos con coma/punto y fechas válidas', () => {
  assert.equal(toCents('12,50'), 1250);
  assert.equal(toCents('12.5'), 1250);
  assert.equal(toCents(7), 700);
  assert.throws(() => toCents('abc'), /número válido/);
  assert.throws(() => toCents('0'), /mayor que cero/);
  assert.throws(() => toCents('1.234'), /2 decimales/);
  assert.equal(isValidISODate('2026-02-29'), false);
  assert.equal(isValidISODate('2028-02-29'), true);
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
});

test('fecha local: a las 21:30 en Bolivia sigue siendo el mismo día (no el UTC)', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-23T01:30:00Z') }); // 21:30 del 22/11 en La Paz
  assert.equal(new Date().toISOString().slice(0, 10), '2026-11-23'); // lo que hacía el código original
  assert.equal(todayISO(), '2026-11-22'); // lo correcto
});

test('registro crea usuario, familia, administrador y 18 categorías base', async () => {
  const user = await registerUser({ name: 'María López', email: 'Maria@Test.com', password: 'clave1234' });
  state.u1 = user;
  assert.equal(user.email, 'maria@test.com');
  assert.ok(user.familyId);
  const db = await getDb();
  const m = await db.getFirstAsync("SELECT rol FROM family_members WHERE user_id=? AND estado='activo'", [user.id]);
  assert.equal(m.rol, 'admin');
  assert.equal((await listCategories(user.familyId, { onlyActive: false })).length, 18);
  await assert.rejects(() => registerUser({ name: 'Otra', email: 'maria@test.com', password: 'clave1234' }), /ya está registrado/);
});

test('login correcto, contraseña incorrecta y sesión restaurable', async () => {
  await assert.rejects(() => loginUser('maria@test.com', 'incorrecta1'), /incorrectos/);
  const u = await loginUser('MARIA@test.com', 'clave1234');
  assert.equal(u.id, state.u1.id);
  assert.equal((await restoreSession()).id, u.id);
  await logoutUser();
  assert.equal(await restoreSession(), null);
});

test('hash antiguo (310 000 rondas) sigue entrando y se actualiza al costo nuevo', async () => {
  const { pbkdf2Async } = await import('@noble/hashes/pbkdf2.js');
  const { sha256 } = await import('@noble/hashes/sha2.js');
  const { bytesToHex, utf8ToBytes } = await import('@noble/hashes/utils.js');
  const salt = 'aabbccddeeff00112233445566778899';
  const legacy = `pbkdf2-sha256$310000$${salt}$` + bytesToHex(await pbkdf2Async(sha256, utf8ToBytes('vieja1234'), utf8ToBytes(salt), { c: 310000, dkLen: 32 }));
  const db = await getDb();
  await db.runAsync("INSERT INTO users(id,nombre,email,password_hash,creado_en,actualizado_en) VALUES('legacy','Usuario Viejo','viejo@test.com',?,'now','now')", [legacy]);
  await loginUser('viejo@test.com', 'vieja1234');
  const row = await db.getFirstAsync("SELECT password_hash FROM users WHERE id='legacy'");
  assert.equal(row.password_hash.split('$')[1], '2000');
  await loginUser('viejo@test.com', 'vieja1234');
  await logoutUser();
});

test('transacciones: monto con coma, categoría/ícono/color en la lectura y resumen', async () => {
  const { id: userId, familyId } = state.u1;
  const tx = await agregarTransaccion({ title: 'Compra supermercado', amount: '12,50', type: 'expense', categoryId: await catId('Alimentación'), userId, familyId, method: 'QR' });
  state.tx = tx;
  assert.equal(tx.amount, 12.5);
  assert.equal(tx.category, 'Alimentación');
  assert.equal(tx.icon, 'silverware-fork-knife'); // ícono traducido a MaterialCommunityIcons
  assert.ok(tx.color);
  assert.equal(tx.method, 'qr');
  await agregarTransaccion({ title: 'Sueldo', amount: 3000, type: 'income', categoryId: await catId('Salario'), userId, familyId });
  const resumen = await obtenerResumenFinanciero({ familyId, viewerUserId: userId });
  assert.deepEqual([resumen.income, resumen.expense, resumen.balance, resumen.count], [3000, 12.5, 2987.5, 2]);
  const gastoCat = await catId('Alimentación');
  await assert.rejects(() => agregarTransaccion({ title: 'X', amount: 5, type: 'income', categoryId: gastoCat, userId, familyId }), /no corresponde/);
});

test('editar y eliminar movimiento; los personales son privados', async () => {
  const { id: userId, familyId } = state.u1;
  const edited = await modificarTransaccion(state.tx.id, { title: 'Súper', amount: '20,75', method: 'Tarjeta' }, userId);
  assert.equal(edited.title, 'Súper');
  assert.equal(edited.amount, 20.75);
  assert.equal(edited.method, 'tarjeta');

  const personal = await agregarTransaccion({ title: 'Regalo secreto', amount: 50, type: 'expense', categoryId: await catId('Otros gastos'), userId, familyId, visibility: 'Personal' });
  const invite = await createLocalInvitation({ familyId, userId });
  const u2 = await registerUser({ name: 'Carlos Pérez', email: 'carlos@test.com', password: 'clave1234' });
  state.u2 = u2;
  await acceptLocalInvitation({ code: invite.code, userId: u2.id });
  const seenByU2 = await obtenerTransacciones({ familyId, viewerUserId: u2.id });
  assert.ok(!seenByU2.some((t) => t.id === personal.id), 'el movimiento personal no debe verlo otro miembro');
  await assert.rejects(() => modificarTransaccion(state.tx.id, { title: 'Hack' }, u2.id), /Solo el autor|permisos/);
  assert.equal(await eliminarTransaccion(personal.id, userId), true);
  assert.equal(await obtenerTransaccionPorId(personal.id), null);
});

test('ventanas de presupuesto: mensual y semanal se renuevan solas', () => {
  assert.deepEqual(budgetWindow('2026-11-05', 'mensual', '2026-11-23'), { start: '2026-11-05', end: '2026-12-05' });
  assert.deepEqual(budgetWindow('2026-11-05', 'mensual', '2027-01-04'), { start: '2026-12-05', end: '2027-01-05' });
  assert.deepEqual(budgetWindow('2026-01-31', 'mensual', '2026-03-01'), { start: '2026-02-28', end: '2026-03-31' });
  assert.deepEqual(budgetWindow('2026-11-02', 'semanal', '2026-11-23'), { start: '2026-11-23', end: '2026-11-30' });
});

test('presupuesto mide solo gastos del periodo vigente y genera alerta sin duplicar', async () => {
  const { id: userId, familyId } = state.u1;
  await saveBudget({ familyId, userId, name: 'Alimentación mensual', amount: '25,00', categoryId: await catId('Alimentación'), period: 'mensual', startDate: '2026-01-01', personal: false });
  const hoy = todayISO();
  const [b] = await getBudgetsWithUsage(familyId);
  assert.ok(b.periodStart <= hoy && hoy < b.periodEnd);
  assert.equal(b.limit, 25);
  // El gasto de 20,75 se registró hoy: está dentro del periodo vigente → 83 %
  assert.equal(Math.round(b.rawPercentage), 83);
  await checkLocalAlerts(familyId, userId);
  await checkLocalAlerts(familyId, userId);
  const notes = await listNotifications(userId);
  assert.equal(notes.filter((n) => n.tipo === 'presupuesto').length, 1);
  assert.ok((await countUnread(userId)) >= 1);
  await markAllNotificationsRead(userId);
  assert.equal(await countUnread(userId), 0);
  // El otro miembro también recibe su propia alerta (antes la clave global se la quitaba)
  await checkLocalAlerts(familyId, state.u2.id);
  assert.equal((await listNotifications(state.u2.id)).filter((n) => n.tipo === 'presupuesto').length, 1);
});

test('metas: aportes con coma, acumulado automático y estado completada', async () => {
  const { id: userId, familyId } = state.u1;
  const goalId = await saveGoal({ familyId, actorUserId: userId, name: 'Fondo de emergencia', targetAmount: '100,00' });
  await addGoalContribution({ goalId, userId, amount: '60,5', description: 'Aporte' });
  let g = await getGoal(goalId);
  assert.equal(g.saved, 60.5);
  assert.equal(g.estado, 'activa');
  await addGoalContribution({ goalId, userId, amount: '39,50' });
  g = await getGoal(goalId);
  assert.equal(g.progress, 100);
  assert.equal(g.estado, 'completada');
  await assert.rejects(() => addGoalContribution({ goalId, userId, amount: 'abc' }), /número válido/);
  await assert.rejects(() => saveGoal({ familyId, actorUserId: userId, name: 'Meta X', targetAmount: '10', dueDate: '31/12/2026' }), /AAAA-MM-DD/);
});

test('deudas: pago parcial, pago total y rechazo si supera el saldo', async () => {
  const { id: userId, familyId } = state.u1;
  const id = await saveDebt({ familyId, userId, title: 'Préstamo', total: '100', counterparty: 'Banco', type: 'por_pagar' });
  await addDebtPayment({ debtId: id, userId, amount: '30,25' });
  let d = await getDebt(id);
  assert.equal([d.saldo_pendiente_centavos, d.estado].join('|'), '6975|parcial');
  await assert.rejects(() => addDebtPayment({ debtId: id, userId, amount: '80' }), /supera el saldo/);
  await addDebtPayment({ debtId: id, userId, amount: '69,75' });
  d = await getDebt(id);
  assert.equal([d.saldo_pendiente_centavos, d.estado].join('|'), '0|pagada');
  await assert.rejects(() => addDebtPayment({ debtId: id, userId, amount: '1' }), /ya no admite pagos/);
});

test('recurrentes: genera movimientos vencidos una sola vez y omite reglas inválidas', async () => {
  const { id: userId, familyId } = state.u1;
  const db = await getDb();
  const start = addMonths(todayISO(), -2);
  const ruleId = await createRecurringRule({ familyId, userId, type: 'expense', categoryId: await catId('Servicios básicos'), amount: '80,00', description: 'Internet', frequency: 'mensual', nextDate: start });
  const first = await processDueRecurringRules();
  assert.equal(first.generated, 3); // hace 2 meses, hace 1 mes y hoy
  const second = await processDueRecurringRules();
  assert.equal(second.generated, 0);
  const n = await db.getFirstAsync('SELECT COUNT(*) n FROM transactions WHERE recurring_rule_id=?', [ruleId]);
  assert.equal(n.n, 3);

  // Regla cuya categoría se desactivó: no debe romper el procesamiento general
  const badRule = await createRecurringRule({ familyId, userId, type: 'expense', categoryId: await catId('Ropa'), amount: '10', description: 'Ropa mensual', frequency: 'mensual', nextDate: addMonths(todayISO(), -1) });
  await db.runAsync("UPDATE categories SET activa=0 WHERE nombre='Ropa'");
  const res = await processDueRecurringRules();
  assert.equal(res.skipped.length, 1);
  assert.equal(res.skipped[0].id, badRule);
  assert.equal(advanceDate('2026-01-31', 'mensual'), '2026-02-28');
});

test('categorías personalizadas: solo admin, sin duplicados y aparecen al listar', async () => {
  const { id: userId, familyId } = state.u1;
  await createCategory({ familyId, userId, name: 'Mascotas', type: 'gasto' });
  await assert.rejects(() => createCategory({ familyId, userId, name: 'mascotas', type: 'gasto' }), /Ya existe/);
  await assert.rejects(() => createCategory({ familyId, userId: state.u2.id, name: 'Otra', type: 'gasto' }), /administrador/);
  const gastos = await listCategories(familyId, { type: 'expense' });
  assert.ok(gastos.some((c) => c.nombre === 'Mascotas'));
});

test('estadísticas y reporte mensual coinciden con los movimientos', async () => {
  const { id: userId, familyId } = state.u1;
  const stats = await getStatistics(familyId, userId);
  assert.ok(stats.totals.income >= 3000);
  assert.ok(stats.categories.length > 0);
  const rep = await getMonthlyReport(familyId, userId, todayISO().slice(0, 7));
  assert.equal(Math.round((rep.income - rep.expense) * 100), Math.round(rep.balance * 100));
});
