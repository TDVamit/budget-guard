const store = new Map();

module.exports = {
  createMMKV: () => ({
    getString: (key) => store.get(key),
    getBoolean: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
    delete: (key) => store.delete(key),
  }),
};
