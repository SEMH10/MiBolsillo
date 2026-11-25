// Réplica mínima de la API async de expo-sqlite sobre node:sqlite (solo para pruebas en Node ≥ 22.13).
import { DatabaseSync } from 'node:sqlite';

export async function openDatabaseAsync() {
  const raw = new DatabaseSync(':memory:');
  const norm = (params = []) => params.map((v) => (v === undefined ? null : v));
  return {
    async execAsync(sql) { raw.exec(sql); },
    async runAsync(sql, params = []) {
      const r = raw.prepare(sql).run(...norm(params));
      return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
    },
    async getFirstAsync(sql, params = []) { return raw.prepare(sql).get(...norm(params)) ?? null; },
    async getAllAsync(sql, params = []) { return raw.prepare(sql).all(...norm(params)); },
    async withTransactionAsync(fn) {
      raw.exec('BEGIN');
      try { await fn(); raw.exec('COMMIT'); } catch (e) { raw.exec('ROLLBACK'); throw e; }
    },
  };
}
