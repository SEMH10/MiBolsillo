import { getDb, newId, now } from '../data/database';

export async function listFavorites(userId) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT f.*, c.nombre categoria FROM favorite_transactions f JOIN categories c ON c.id=f.categoria_id WHERE f.user_id=? ORDER BY f.creado_en DESC',
    [userId]
  );
}

export async function addFavoriteFromTransaction(tx, userId) {
  const db = await getDb();
  const exists = await db.getFirstAsync(
    'SELECT id FROM favorite_transactions WHERE user_id=? AND lower(nombre)=lower(?) AND categoria_id=? AND tipo=?',
    [userId, tx.title, tx.categoryId, tx.type === 'income' ? 'ingreso' : 'gasto']
  );
  if (exists) throw new Error('Este movimiento ya está en tus favoritos.');
  await db.runAsync(
    'INSERT INTO favorite_transactions(id,family_id,user_id,nombre,tipo,categoria_id,metodo_pago,visibilidad,creado_en) VALUES(?,?,?,?,?,?,?,?,?)',
    [newId('fav'), tx.familyId, userId, tx.title, tx.type === 'income' ? 'ingreso' : 'gasto', tx.categoryId, tx.method || 'efectivo', tx.visibility === 'Personal' ? 'personal' : 'familiar', now()]
  );
}

export async function removeFavorite(id, userId) {
  const db = await getDb();
  await db.runAsync('DELETE FROM favorite_transactions WHERE id=? AND user_id=?', [id, userId]);
}
