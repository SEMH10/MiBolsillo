import { all, one, insert, update, remove, stamp } from './repository';
const TABLE='invitations';
const FILTERS=["family_id", "codigo", "usado_por", "revocada"];
export const crearInvitaciones = data => { const row={...data}; if(row['creado_en']==null) row['creado_en']=stamp(); return insert(TABLE,row); };
export const obtenerInvitations = (filters={}) => { const keys=Object.keys(filters).filter(k=>FILTERS.includes(k)); const where=keys.length?`WHERE ${keys.map(k=>`${k}=?`).join(' AND ')}`:''; return all(TABLE,where,keys.map(k=>filters[k]),'ORDER BY rowid DESC'); };
export const obtenerInvitationsPorId = id => one(TABLE,id);
export const actualizarInvitations = (id,data) => update(TABLE,id,{...data});
export const eliminarInvitations = id => revocarInvitacion(id);
export async function revocarInvitacion(id){return actualizarInvitations(id,{revocada:1});}
export const eliminarInvitaciones = revocarInvitacion;
