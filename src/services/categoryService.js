import { getDb, newId, now } from '../data/database';

// Categorías visibles para una familia: las del sistema (family_id NULL) + las propias.
// type: 'income' | 'expense' | undefined (todas)
export async function listCategories(familyId, { type, onlyActive = true } = {}) {
  const db = await getDb();
  const where = ['(family_id IS NULL OR family_id=?)'];
  const args = [familyId];
  if (type) { where.push('tipo=?'); args.push(type === 'income' ? 'ingreso' : 'gasto'); }
  if (onlyActive) where.push('activa=1');
  return db.getAllAsync(`SELECT * FROM categories WHERE ${where.join(' AND ')} ORDER BY tipo, family_id IS NOT NULL, nombre`, args);
}

async function assertAdmin(db, familyId, userId, message) {
  const m = await db.getFirstAsync("SELECT rol FROM family_members WHERE family_id=? AND user_id=? AND estado='activo'", [familyId, userId]);
  if (m?.rol !== 'admin') throw new Error(message);
}

export async function createCategory({ familyId, userId, name, type }) {
  const db = await getDb();
  const clean = String(name || '').trim();
  if (clean.length < 2) throw new Error('Escribe un nombre de al menos 2 caracteres.');
  await assertAdmin(db, familyId, userId, 'Solo un administrador puede crear categorías familiares.');
  const kind = type === 'ingreso' ? 'ingreso' : 'gasto';
  const dup = await db.getFirstAsync('SELECT id FROM categories WHERE tipo=? AND lower(nombre)=lower(?) AND (family_id IS NULL OR family_id=?)', [kind, clean, familyId]);
  if (dup) throw new Error('Ya existe una categoría con ese nombre.');
  await db.runAsync(
    'INSERT INTO categories(id,family_id,tipo,nombre,icono,color,activa,creado_en) VALUES(?,?,?,?,?,?,1,?)',
    [newId('cat'), familyId, kind, clean, 'tag', kind === 'ingreso' ? '#10B981' : '#F59E0B', now()]
  );
}

export async function toggleCategory({ row, familyId, userId }) {
  if (!row.family_id) throw new Error('Las categorías del sistema no se pueden desactivar.');
  const db = await getDb();
  await assertAdmin(db, familyId, userId, 'Solo un administrador puede activar o desactivar categorías.');
  await db.runAsync('UPDATE categories SET activa=? WHERE id=?', [row.activa ? 0 : 1, row.id]);
}
