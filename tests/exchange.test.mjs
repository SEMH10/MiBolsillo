import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchUsdToBobRate, getUsdToBobRate, getCachedRate, convertAmount } from '../src/services/exchangeRateService.js';

const okPayload = { result: 'success', base_code: 'USD', time_last_update_utc: 'Tue, 24 Nov 2026 00:02:31 +0000', time_next_update_utc: 'Wed, 25 Nov 2026 00:12:11 +0000', rates: { USD: 1, BOB: 6.96, EUR: 0.9 } };
const mockFetch = (impl) => { globalThis.fetch = impl; };
const json = (body, ok = true, status = 200) => Promise.resolve({ ok, status, json: async () => body });

test('lee USD→BOB y descarta el resto de monedas', async () => {
  mockFetch(() => json(okPayload));
  const r = await fetchUsdToBobRate();
  assert.deepEqual([r.base, r.target, r.rate, r.source], ['USD', 'BOB', 6.96, 'open.er-api.com']);
  assert.equal(r.EUR, undefined);
});

test('rechaza respuestas inválidas o con error HTTP', async () => {
  mockFetch(() => json({ result: 'error' }));
  await assert.rejects(fetchUsdToBobRate(), /no contiene un tipo de cambio/);
  mockFetch(() => json({ result: 'success', rates: { BOB: 0 } }));
  await assert.rejects(fetchUsdToBobRate(), /no contiene un tipo de cambio/);
  mockFetch(() => json({}, false, 503));
  await assert.rejects(fetchUsdToBobRate(), /HTTP 503/);
});

test('sin internet y sin caché lanza error claro; con caché devuelve el último valor', async () => {
  mockFetch(() => Promise.reject(new TypeError('Network request failed')));
  assert.equal(await getCachedRate(), null);
  await assert.rejects(getUsdToBobRate(), /No se pudo conectar/);

  mockFetch(() => json(okPayload));
  const fresh = await getUsdToBobRate();
  assert.equal(fresh.fromCache, false);

  mockFetch(() => Promise.reject(new TypeError('Network request failed')));
  const offline = await getUsdToBobRate();
  assert.equal(offline.fromCache, true);
  assert.equal(offline.rate, 6.96);
  assert.match(offline.error, /No se pudo conectar/);
});

test('tiempo de espera agotado se informa en español', async () => {
  mockFetch((url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))));
  await assert.rejects(fetchUsdToBobRate({ timeoutMs: 20 }), /tardó demasiado/);
});

test('convertidor acepta coma, rechaza texto y respeta la dirección', () => {
  assert.equal(convertAmount('696', 6.96, 'bobToUsd'), 100);
  assert.equal(convertAmount('10,5', 6.96, 'usdToBob'), 10.5 * 6.96);
  assert.equal(convertAmount('', 6.96, 'bobToUsd'), null);
  assert.equal(convertAmount('abc', 6.96, 'bobToUsd'), null);
  assert.equal(convertAmount('-5', 6.96, 'bobToUsd'), null);
});
