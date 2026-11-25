// Utilidades compartidas de formato, fechas y montos.
// Todas las fechas "de calendario" se manejan en hora LOCAL (YYYY-MM-DD).
// Usar toISOString().slice(0,10) devuelve la fecha UTC y en Bolivia (UTC-4)
// cambia de día a las 20:00, por eso se evita.

export const money = (n) =>
  Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pad = (n) => String(n).padStart(2, '0');

export const toISODate = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISODate(new Date());
export const currentMonthISO = () => todayISO().slice(0, 7);

// Convierte 'YYYY-MM-DD' a Date local (mediodía, evita saltos por zona horaria).
export const parseISODate = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

export const isValidISODate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const d = parseISODate(value);
  return !Number.isNaN(d.getTime()) && toISODate(d) === value;
};

// Suma meses conservando el día ancla (31 ene + 1 mes = 28/29 feb).
export const addMonths = (iso, months, anchorDay) => {
  const base = parseISODate(iso);
  const day = anchorDay || base.getDate();
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1, 12, 0, 0);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, last));
  return toISODate(target);
};

export const addDays = (iso, days) => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

export const formatDateEs = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

// Acepta "12,50", "12.50" o 12.5. Devuelve CENTAVOS (entero) o lanza un error claro.
export const toCents = (value, label = 'El monto') => {
  const text = String(value ?? '').trim().replace(/\s/g, '').replace(',', '.');
  if (!text || !/^\d+(\.\d{1,2})?$/.test(text)) {
    throw new Error(`${label} debe ser un número válido (máximo 2 decimales).`);
  }
  const cents = Math.round(Number(text) * 100);
  if (!Number.isFinite(cents) || cents <= 0) throw new Error(`${label} debe ser mayor que cero.`);
  return cents;
};

export const initials = (name = 'U') =>
  String(name).trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase() || 'U';

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
