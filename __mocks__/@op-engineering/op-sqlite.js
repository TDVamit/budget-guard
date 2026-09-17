module.exports = {
  open: () => ({
    execute: async () => ({ rows: [], insertId: undefined, rowsAffected: 0 }),
    executeSync: () => ({ rows: [], insertId: undefined, rowsAffected: 0 }),
  }),
};
