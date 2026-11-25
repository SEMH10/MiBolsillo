import { all, one, insert, update, remove, stamp } from './repository';
const TABLE='audit_log';
const FILTERS=["family_id", "user_id", "entidad", "entidad_id", "accion"];
export const crearAuditoria = data => { const row={...data}; if(row['fecha']==null) row['fecha']=stamp(); return insert(TABLE,row); };
export const obtenerAudit_log = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerAudit_logPorId = id => one(TABLE,id);
export const actualizarAudit_log = (id,data) => update(TABLE,id,{...data});
export const eliminarAudit_log = id => remove(TABLE,id,false);
export async function eliminarAuditoria(){throw new Error('El historial de auditoría es inmutable y no se puede eliminar desde la aplicación.');}
