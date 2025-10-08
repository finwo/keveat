import {Command} from "commander"
import { plugin as routerPlugin } from '@finwo/router-fastify';
import {env} from "../env";
import fastify, {FastifyReply, FastifyRequest} from "fastify";
import path from "path";
import {db} from '../db';

type CommandOptions = {
  clusterKey: string;
  ui: boolean;
  port: string;
};

export default function(program: Command) {
  program
    .command('agent')
    .description('Start the agent')
    .requiredOption('--cluster-key <secret-key>', 'Set the secret key for the cluster')
    .option('--port <port>', 'Set the port to listen on', `${env.PORT}`)
    .option('--ui', 'Enable the webui', false)
    .action(async (opts: CommandOptions) => {

      const app = fastify();
      // app.register(routerPlugin, controllers);

      if (opts.ui) {
        app.get('/', (req: FastifyRequest, res: FastifyReply) => {
          res.redirect('/ui/', 301);
        });
        app.register(require('@fastify/static'), {
          root: path.join(__dirname, '..', '..', '..', 'frontend', 'dist'),
          prefix: '/ui/',
        });
      }

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

      app.listen({ port: parseInt(opts.port) }, (err: Error | null, addr: string) => {
        if (err) throw err;
        console.log(`Backend listening on ${addr}`);
      });

      console.log({ opts });
    })
    ;
};





// import { plugin as routerPlugin } from '@finwo/router-fastify';
// import path from 'node:path';

// import fastify, {FastifyReply, FastifyRequest} from 'fastify';
// import {env} from './env';
// import {db} from './db';

// const controllers: any[] = [];

// (() => {
//   const app = fastify();
//   app.register(routerPlugin, controllers);



// })();
