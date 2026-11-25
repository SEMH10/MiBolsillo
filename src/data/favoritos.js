import { all, one, insert, update, remove, stamp } from './repository';
const TABLE='favorite_transactions';
const FILTERS=["user_id", "family_id", "tipo"];
export const crearFavoritos = data => { const row={...data}; if(row['creado_en']==null) row['creado_en']=stamp(); return insert(TABLE,row); };
export const obtenerFavorite_transactions = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerFavorite_transactionsPorId = id => one(TABLE,id);
export const actualizarFavorite_transactions = (id,data) => update(TABLE,id,{...data});
export const eliminarFavorite_transactions = id => remove(TABLE,id,false);
