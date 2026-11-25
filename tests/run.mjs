// Empaqueta los módulos de datos/servicios con esbuild (sustituyendo los módulos nativos de Expo
// por réplicas para Node) y ejecuta las pruebas con el ejecutor integrado de Node.
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'tests', '.build');
mkdirSync(out, { recursive: true });
const entries = readdirSync(path.join(root, 'tests')).filter((f) => f.endsWith('.test.mjs')).map((f) => path.join(root, 'tests', f));

await build({
  entryPoints: entries,
  outdir: out,
  bundle: true,
  platform: 'node',
  format: 'esm',
  outExtension: { '.js': '.mjs' },
  logLevel: 'warning',
  alias: {
    'expo-sqlite': path.join(root, 'tests/shims/expo-sqlite.js'),
    'expo-crypto': path.join(root, 'tests/shims/expo-crypto.js'),
    'expo-secure-store': path.join(root, 'tests/shims/expo-secure-store.js'),
  },
  external: ['node:*'],
});

const built = readdirSync(out).filter((f) => f.endsWith('.test.mjs')).map((f) => path.join(out, f));
const res = spawnSync(process.execPath, ['--no-warnings', '--test', ...built], { stdio: 'inherit', env: { ...process.env, TZ: 'America/La_Paz' } });
process.exit(res.status ?? 1);
