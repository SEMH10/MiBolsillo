import { all, one, insert, update, remove, stamp } from './repository';
const TABLE='categories';
const FILTERS=["family_id", "tipo", "activa"];
export const crearCategorias = data => { const row={...data}; if(row['creado_en']==null) row['creado_en']=stamp(); return insert(TABLE,row); };
export const obtenerCategories = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerCategoriesPorId = id => one(TABLE,id);
export const actualizarCategories = (id,data) => update(TABLE,id,{...data});
export const eliminarCategories = id => remove(TABLE,id,false);
