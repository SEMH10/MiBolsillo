import { all, one, insert, update, remove, stamp } from './repository';
const TABLE='notifications';
const FILTERS=["user_id", "family_id", "leida", "tipo"];
export const crearNotificaciones = data => { const row={...data}; if(row['creada_en']==null) row['creada_en']=stamp(); return insert(TABLE,row); };
export const obtenerNotifications = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerNotificationsPorId = id => one(TABLE,id);
export const actualizarNotifications = (id,data) => update(TABLE,id,{...data});
export const eliminarNotifications = id => remove(TABLE,id,false);
