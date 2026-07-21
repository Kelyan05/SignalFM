/**
 * Minimal in-memory stand-in for the slice of the Firestore Admin SDK this
 * app actually calls: collection().doc().get()/set(), db.getAll(), and
 * db.runTransaction(). Deliberately not the real Firestore emulator — that
 * needs a Java runtime and a running process, which buys nothing here since
 * these tests exist to verify our own routing/controller/service logic, not
 * Google's transaction engine. Kept honest by only implementing exactly the
 * calls the codebase makes (grep for `db.` under server/ if this ever needs
 * to grow).
 */
export function createFakeFirestore() {
  const store = new Map();

  const makeDocRef = (path) => ({
    path,
    async get() {
      const data = store.get(path);
      return {
        exists: data !== undefined,
        data: () => data,
        id: path.split("/").pop(),
      };
    },
    async set(data, opts = {}) {
      const existing = opts.merge ? store.get(path) : undefined;
      store.set(path, { ...existing, ...data });
    },
    collection(sub) {
      return makeCollectionRef(`${path}/${sub}`);
    },
  });

  const makeCollectionRef = (path) => ({
    doc(id) {
      return makeDocRef(`${path}/${id}`);
    },
  });

  return {
    collection: (name) => makeCollectionRef(name),
    getAll: async (...refs) => Promise.all(refs.map((ref) => ref.get())),
    runTransaction: async (fn) =>
      fn({
        get: (ref) => ref.get(),
        set: (ref, data, opts) => ref.set(data, opts),
      }),
    // Test-only helpers, not part of the real Firestore surface.
    _seed(path, data) {
      store.set(path, data);
    },
    _get(path) {
      return store.get(path);
    },
    _reset() {
      store.clear();
    },
  };
}
