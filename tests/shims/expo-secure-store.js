const store = new Map();
export async function setItemAsync(k, v) { store.set(k, v); }
export async function getItemAsync(k) { return store.has(k) ? store.get(k) : null; }
export async function deleteItemAsync(k) { store.delete(k); }
