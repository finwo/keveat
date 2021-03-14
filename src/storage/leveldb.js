const AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN;
const autolevel         = require('autolevel');
const levelup           = require('levelup');

module.exports = (opts) => {
  let ldb = null;

  // Handle AbstractLevelDOWN-based adapters
  if (opts instanceof AbstractLevelDOWN) {
    ldb = levelup(ldb);
  }

  // Handle autolevel (string-based connection)
  if ('string' === typeof opts) {
    ldb = autolevel(opts);
  }

  // No suitable handler found
  if (!ldb) {
    throw new Error(`No suitable leveldb handler found for ${opts}`);
  }

  // Promisified leveldb
  return {
    get(key) {
      return new Promise((resolve,reject) => {
        ldb.get(key, (err, data) => {
          if (err) return reject(err);
          return resolve(data);
        });
      });
    },
    set(key, value) {
      return new Promise((resolve,reject) => {
        ldb.put(key, value, (err, data) => {
          if (err) return reject(err);
          return resolve(data);
        });
      });
    },
    delete(key) {
      return new Promise((resolve,reject) => {
        ldb.del(key, (err, data) => {
          if (err) return reject(err);
          return resolve(data);
        });
      });
    },
    close() {
      return new Promise((resolve,reject) => {
        ldb.close((err, data) => {
          if (err) return reject(err);
          return resolve(data);
        });
      });
    },
    optimize() {
      return Promise.resolve();
    },
  };
};
