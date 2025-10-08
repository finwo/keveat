import { plugin as routerPlugin } from '@finwo/router-fastify';
import path from 'node:path';

import fastify, {FastifyReply, FastifyRequest} from 'fastify';
import {env} from './env';
import {db} from './db';

const controllers: any[] = [];

(() => {
  const app = fastify();
  app.register(routerPlugin, controllers);

  // Root redirect to ui
  app.get('/', (req: FastifyRequest, res: FastifyReply) => {
    res.redirect('/ui/', 301);
  });

  // Host UI on /ui/
  app.register(require('@fastify/static'), {
    root: path.join(__dirname, '..', '..', 'frontend', 'dist'),
    prefix: '/ui/',
  });

  // Debug interface
  app.get('/dbg/kv/*', async (req: FastifyRequest, res: FastifyReply) => {
    // get single key
    const params = req.params as { '*': string };
    const key    = '/' + params['*'].split('/').filter(Boolean).join('/');
    const result = await db.get(key);
    return {
      method: 'get',
      key,
      result,
    };
  });
  app.options('/dbg/kv/*', async (req: FastifyRequest, res: FastifyReply) => {
    // list keys (adds '/' to end of key)
    const params = req.params as { '*': string };
    const key    = '/' + params['*'].split('/').filter(Boolean).join('/');
    const sep    = key === '/' ? '' : '/';
    const foundKeys: string[] = [];
    // Iterate entries with keys that are greater than 'a'
    for await (const [foundKey,_] of db.iterator({
      gte: `${key}${sep}\x00\x00\x00\x00`,
      lte: `${key}${sep}\xff\xff\xff\xff`,
      keys: true,
      values: false
    })) {
      foundKeys.push(foundKey);
    }
    return {
      method: 'options',
      key,
      foundKeys,
    };
  });
  app.put('/dbg/kv/*', async (req: FastifyRequest, res: FastifyReply) => {
    // write to key
    const params = req.params as { '*': string };
    const key    = '/' + params['*'].split('/').filter(Boolean).join('/');
    const value  = req.body;
    const result = await db.put(key, value as string);
    return {
      method: 'put',
      key,
      value,
      result
    };
  });
  app.delete('/dbg/kv/*', async (req: FastifyRequest, res: FastifyReply) => {
    // delete key
    const params = req.params as { '*': string };
    const key    = '/' + params['*'].split('/').filter(Boolean).join('/');
    const result = await db.del(key);
    return {
      method: 'delete',
      key,
      result,
    };
  });

  app.listen({ port: env.PORT }, (err: Error | null, addr: string) => {
    if (err) throw err;
    console.log(`Backend listening on ${addr}`);
  });
})();
