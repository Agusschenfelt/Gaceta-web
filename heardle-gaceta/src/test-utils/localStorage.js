/**
 * Minimal localStorage for the `node` test environment, so storage-backed
 * modules can be tested without pulling in jsdom.
 */
export function installLocalStorage() {
  const store = new Map();
  const mock = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  globalThis.localStorage = mock;
  return mock;
}

/** Makes every localStorage call throw, as Safari private mode does. */
export function installFailingLocalStorage() {
  const boom = () => {
    throw new Error("storage disabled");
  };
  globalThis.localStorage = {
    getItem: boom,
    setItem: boom,
    removeItem: boom,
    clear: boom,
    key: boom,
    length: 0,
  };
}
