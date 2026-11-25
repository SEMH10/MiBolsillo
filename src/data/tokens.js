import { all, one, insert, update, remove, stamp } from './repository';
const TABLE='push_tokens';
const FILTERS=["user_id", "plataforma"];
export const crearTokens = data => { const row={...data}; if(row['actualizado_en']==null) row['actualizado_en']=stamp(); return insert(TABLE,row); };
export const obtenerPush_tokens = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerPush_tokensPorId = id => one(TABLE,id);
export const actualizarPush_tokens = (id,data) => update(TABLE,id,{...data});
export const eliminarPush_tokens = id => remove(TABLE,id,false);
