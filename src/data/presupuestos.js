import { all, one, insert, update, remove, stamp } from './repository';
const TABLE='budgets';
const FILTERS=["family_id", "user_id", "activo"];
export const crearPresupuestos = data => { const row={...data}; if(row['creado_en']==null) row['creado_en']=stamp(); if(row['actualizado_en']==null) row['actualizado_en']=stamp(); return insert(TABLE,row); };
export const obtenerBudgets = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerBudgetsPorId = id => one(TABLE,id);
export const actualizarBudgets = (id,data) => update(TABLE,id,{...data, actualizado_en:stamp()});
export const eliminarBudgets = id => remove(TABLE,id,false);
