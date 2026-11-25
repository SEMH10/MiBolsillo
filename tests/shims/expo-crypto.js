import { randomBytes } from 'node:crypto';
export async function getRandomBytesAsync(n) { return new Uint8Array(randomBytes(n)); }
