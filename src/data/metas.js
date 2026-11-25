import { all, one, insert, update, remove, stamp } from './repository';
const TABLE='saving_goals';
const FILTERS=["family_id", "user_id", "estado"];
export const crearMetas = data => { const row={...data}; if(row['creado_en']==null) row['creado_en']=stamp(); if(row['actualizado_en']==null) row['actualizado_en']=stamp(); return insert(TABLE,row); };
export const obtenerSaving_goals = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerSaving_goalsPorId = id => one(TABLE,id);
export const actualizarSaving_goals = (id,data) => update(TABLE,id,{...data, actualizado_en:stamp()});
export const eliminarSaving_goals = async id => update(TABLE,id,{estado:'cancelada',actualizado_en:stamp()});
