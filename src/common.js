const storageAdapters = require("./storage");
const secretStore     = new WeakMap();

class Keveat {

  constructor(opts) {
    opts = opts || {};
    const secret = {storage:[]};

    // Fetch storage config
    const storageOpts = Object.assign({
      memory: true,
    },opts.storage||{});

    // Turn config into actual adapters
    for(const adapter of storageAdapters) {
      if (!storageOpts[adapter.name]) continue;
      secret.storage.push(adapter.handler(storageOpts[adapter.name]));
    }

    // Store secrets, unreachable from public's eyes
    secretStore.set(this,secret);
  }

  get(key) {
    return new Promise(async (resolve,reject) => {
      const secret   = secretStore.get(this);
      let   resolved = false;
      let   adapters = secret.storage.map(async adapter => {
        try {
          const data = await adapter.get(key);
          if (resolved) return;
          resolved = true;
          resolve(data);
        } catch(e) {}
      });
      await Promise.all(adapters);
      if (resolved) return;
      resolved = true;
      console.log('FALLBACK');
      resolve(undefined);
    });
  }

  async set(key, value) {
    const secret = secretStore.get(this);
    await Promise.all(secret.storage.map(adapter => adapter.set(key,value)));
  }

  delete(key) {
    const secret = secretStore.get(this);
    await Promise.all(secret.storage.map(adapter => adapter.delete(key)));
  }

  optimize() {
    const secret = secretStore.get(this);
    await Promise.all(secret.storage.map(adapter => adapter.optimize()));
  }

  close() {
    const secret = secretStore.get(this);
    await Promise.all(secret.storage.map(adapter => adapter.close()));
  }

}

module.exports = Keveat;
