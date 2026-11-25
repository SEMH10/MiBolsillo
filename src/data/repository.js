import { getDb, newId, now } from './database';
export async function all(table, where='', params=[], order='') { const db=await getDb(); return db.getAllAsync(`SELECT * FROM ${table} ${where} ${order}`,params); }
export async function one(table,id) { const db=await getDb(); return db.getFirstAsync(`SELECT * FROM ${table} WHERE id=?`,[id]); }
export async function insert(table,data) { const db=await getDb(); const row={...data,id:data.id||newId(table)}; const keys=Object.keys(row); await db.runAsync(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`,keys.map(k=>row[k])); return one(table,row.id); }
export async function update(table,id,data) { const db=await getDb(); const keys=Object.keys(data).filter(k=>k!=='id'); if(!keys.length) return one(table,id); await db.runAsync(`UPDATE ${table} SET ${keys.map(k=>`${k}=?`).join(',')} WHERE id=?`,[...keys.map(k=>data[k]),id]); return one(table,id); }
export async function remove(table,id,soft=false) { const db=await getDb(); if(soft) await db.runAsync(`UPDATE ${table} SET deleted_at=? WHERE id=?`,[now(),id]); else await db.runAsync(`DELETE FROM ${table} WHERE id=?`,[id]); return true; }
export const stamp = now;
