module.exports = (opts) => {
  const data = {};
  return {
    get(key) {
      return Promise.resolve(data[key]);
    },
    set(key, value) {
      data[key] = value;
      return Promise.resolve();
    },
    delete(key) {
      delete data[key];
      return Promise.resolve();
    },
    close() {
      return Promise.resolve();
    },
    optimize() {
      return Promise.resolve();
    },
  };
};
