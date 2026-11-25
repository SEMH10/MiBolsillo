import { all, one, insert, update, remove, stamp } from './repository';
const TABLE='families';
const FILTERS=["creado_por", "archivado"];
export const crearFamilias = data => { const row={...data}; if(row['creado_en']==null) row['creado_en']=stamp(); if(row['actualizado_en']==null) row['actualizado_en']=stamp(); return insert(TABLE,row); };
export const obtenerFamilies = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerFamiliesPorId = id => one(TABLE,id);
export const actualizarFamilies = (id,data) => update(TABLE,id,{...data, actualizado_en:stamp()});
export const eliminarFamilies = id => archivarFamilia(id);
export async function archivarFamilia(id){return actualizarFamilies(id,{archivado:1});}
export async function reactivarFamilia(id){return actualizarFamilies(id,{archivado:0});}
export async function eliminarFamilias(id){return archivarFamilia(id);}
