import { all, one, insert, update, remove, stamp } from './repository';
const TABLE='debts';
const FILTERS=["family_id", "creado_por", "responsable_id", "estado", "deleted_at"];
export const crearDeudas = data => { const row={...data}; if(row['actualizado_en']==null) row['actualizado_en']=stamp(); return insert(TABLE,row); };
export const obtenerDebts = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerDebtsPorId = id => one(TABLE,id);
export const actualizarDebts = (id,data) => update(TABLE,id,{...data, actualizado_en:stamp()});
export const eliminarDebts = id => remove(TABLE,id,true);
