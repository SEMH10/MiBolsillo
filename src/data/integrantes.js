import { all, one, insert, update, remove, stamp } from './repository';
import {getDb,now} from './database';
const TABLE='family_members';
const FILTERS=["user_id", "family_id", "estado", "rol"];
export const crearIntegrantes = data => { const row={...data}; if(row['unido_en']==null) row['unido_en']=stamp(); return insert(TABLE,row); };
export const obtenerFamily_members = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerFamily_membersPorId = id => one(TABLE,id);
export const actualizarFamily_members = (id,data) => update(TABLE,id,{...data});
export const eliminarFamily_members = id => retirarIntegrante(id);
export async function retirarIntegrante(id){const db=await getDb();await db.runAsync("UPDATE family_members SET estado='expulsado',salio_en=? WHERE id=?",[now(),id]);return obtenerFamily_membersPorId(id);}
export const eliminarIntegrantes = retirarIntegrante;
