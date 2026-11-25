import { all, one, insert, update, remove, stamp } from './repository';
const TABLE='receipts';
const FILTERS=["transaction_id"];
export const crearComprobantes = data => { const row={...data}; if(row['creado_en']==null) row['creado_en']=stamp(); return insert(TABLE,row); };
export const obtenerReceipts = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerReceiptsPorId = id => one(TABLE,id);
export const actualizarReceipts = (id,data) => update(TABLE,id,{...data});
export const eliminarReceipts = id => remove(TABLE,id,false);
