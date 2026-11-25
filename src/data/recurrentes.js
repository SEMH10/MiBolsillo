import { all, one, insert, update, remove, stamp } from './repository';
const TABLE='recurring_rules';
const FILTERS=["family_id", "user_id", "activa", "frecuencia"];
export const crearRecurrentes = data => { const row={...data}; if(row['creado_en']==null) row['creado_en']=stamp(); return insert(TABLE,row); };
export const obtenerRecurring_rules = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerRecurring_rulesPorId = id => one(TABLE,id);
export const actualizarRecurring_rules = (id,data) => update(TABLE,id,{...data});
export const eliminarRecurring_rules = id => desactivarReglaRecurrente(id);
export async function desactivarReglaRecurrente(id){return actualizarRecurring_rules(id,{activa:0});}
export const eliminarRecurrentes = desactivarReglaRecurrente;
