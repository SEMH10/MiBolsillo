import { getDb, now } from '../data/database';

// API pública y gratuita (sin clave): https://open.er-api.com
const EXCHANGE_RATE_URL = 'https://open.er-api.com/v6/latest/USD';
const TIMEOUT_MS = 10000;

// Consulta el tipo de cambio de referencia USD → BOB y devuelve solo lo que usa la app.
export async function fetchUsdToBobRate({ timeoutMs = TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(EXCHANGE_RATE_URL, { method: 'GET', headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`El servicio respondió con el código HTTP ${response.status}.`);
    const payload = await response.json();
    const rate = Number(payload?.rates?.BOB);
    if (payload?.result !== 'success' || !Number.isFinite(rate) || rate <= 0) {
      throw new Error('La respuesta del servicio no contiene un tipo de cambio BOB válido.');
    }
    return {
      base: payload.base_code || 'USD',
      target: 'BOB',
      rate,
      lastUpdate: payload.time_last_update_utc || null,
      nextUpdate: payload.time_next_update_utc || null,
      source: 'open.er-api.com',
    };
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('El servicio tardó demasiado en responder. Inténtalo nuevamente.');
    if (error instanceof TypeError) throw new Error('No se pudo conectar. Verifica tu conexión a internet e inténtalo nuevamente.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ---- Caché local (SQLite): permite ver el último valor conocido sin internet ----
async function ensureCache(db) {
  await db.execAsync(`CREATE TABLE IF NOT EXISTS exchange_rate_cache(
    id INTEGER PRIMARY KEY CHECK(id=1), base TEXT NOT NULL, target TEXT NOT NULL, rate REAL NOT NULL,
    last_update TEXT, next_update TEXT, source TEXT, fetched_at TEXT NOT NULL)`);
}

export async function getCachedRate() {
  const db = await getDb();
  await ensureCache(db);
  const r = await db.getFirstAsync('SELECT * FROM exchange_rate_cache WHERE id=1');
  return r && { base: r.base, target: r.target, rate: r.rate, lastUpdate: r.last_update, nextUpdate: r.next_update, source: r.source, fetchedAt: r.fetched_at };
}

async function saveCachedRate(data) {
  const db = await getDb();
  await ensureCache(db);
  await db.runAsync(
    'INSERT INTO exchange_rate_cache(id,base,target,rate,last_update,next_update,source,fetched_at) VALUES(1,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET base=excluded.base,target=excluded.target,rate=excluded.rate,last_update=excluded.last_update,next_update=excluded.next_update,source=excluded.source,fetched_at=excluded.fetched_at',
    [data.base, data.target, data.rate, data.lastUpdate, data.nextUpdate, data.source, now()]
  );
}

// Intenta la red; si falla y hay un valor guardado, lo devuelve marcado con fromCache.
export async function getUsdToBobRate() {
  try {
    const fresh = await fetchUsdToBobRate();
    await saveCachedRate(fresh).catch(() => {});
    return { ...fresh, fromCache: false };
  } catch (error) {
    const cached = await getCachedRate().catch(() => null);
    if (cached) return { ...cached, fromCache: true, error: error.message };
    throw error;
  }
}

// Convierte un texto ("10,5" o "10.5") usando el tipo de cambio. Devuelve null si no es un número válido.
export function convertAmount(text, rate, direction) {
  const value = Number(String(text ?? '').trim().replace(',', '.'));
  if (!String(text ?? '').trim() || !Number.isFinite(value) || value < 0 || !rate) return null;
  return direction === 'usdToBob' ? value * rate : value / rate;
}
