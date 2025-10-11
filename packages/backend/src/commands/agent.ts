import http, {IncomingMessage, ServerResponse} from 'node:http';
import {Command} from "commander"
import {env} from "../env";
import morgan from 'morgan';

import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream, read } from 'node:fs';
import {db,meta} from '../db';

import {Meta} from "../common/types";
import {stat, Stats} from 'node:fs';
import { lookup as getMime } from 'mime-types';

type CommandOptions = {
  clusterKey: string;
  ui: boolean;
  port: string;
  peer: string[];
};

const buildList = (item: string, list: string[]) => [...(list ?? []), ...item.split(',')]

const staticDir    = path.resolve(__dirname, '..', '..', '..', 'frontend', 'dist');
const staticPrefix = '/ui';
const staticIndex  = 'index.html';

export default function(program: Command) {
  program
    .command('agent')
    .description('Start the agent')
    .requiredOption('--cluster-key <keypair>', 'Set the keypair for the cluster')
    .option('--port <port>', 'Set the port to listen on', `${env.PORT}`)
    .option('--ui', 'Enable the webui', false)
    .option('--peer <address>', 'Add a remote peer', buildList, [])
    .action(async (opts: CommandOptions) => {

      const logger = morgan('tiny');

      const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
        await new Promise(done => logger(req, res, done));

        const url = req.url||'/';

        if (opts.ui) {
          if (url.startsWith(staticPrefix)) {
            // Handle OPTIONS
            if (req.method === 'OPTIONS') {
              res.setHeader('Allow', 'GET, OPTIONS');
              res.end();
              return;
            }
            // Only GET
            if (req.method !== 'GET') {
              res.statusCode = 405;
              res.write(res.statusMessage = 'Method Not Allowed');
              res.end();
              return;
            }
            // Basic static server
            let relative = (req.url||'/').slice(staticPrefix.length) || '/';
            if (relative.slice(-1) === '/') relative += staticIndex;
            let target = path.join(staticDir, relative);
            if (!target.startsWith(staticDir)) {
              res.statusCode = 404;
              res.write(res.statusMessage = 'Not Found');
              res.end();
              return;
            }
            let stat: (Stats&{exists:true}) | {exists:false};
            try {
              stat = Object.assign(await fs.stat(target), { exists: true });
            } catch(e) {
              stat = { exists: false };
            }
            if (!(stat.exists && stat.isFile())) {
              res.statusCode = 404;
              res.write(res.statusMessage = 'Not Found');
              res.end();
              return;
            }
            res.setHeader('Content-Type', getMime(target) || 'application/octet-stream')
            const readstream = createReadStream(target);
            readstream.on('data', chunk => res.write(chunk));
            readstream.on('end', () => { readstream.close(); res.end(); });
            return;
          }
        }

        if (req.method === 'OPTIONS') {
          res.setHeader('Allow', 'OPTIONS, GET, PUT, DELETE, NOTIFY');
          res.end();
          return;
        }

        const key = req.url;
        if (!key) {
          res.statusCode = 400;
          res.statusMessage = 'Bad Request';
          res.end();
          return;
        }

        const _meta = (await meta.get(key) || { version: 0, exists: false, contentType: null }) as Meta;

        if (req.method === 'NOTIFY') {
          // TODO:
          //    if received > local, fetch update
          //    if received < local, notify of update
          //    if received = local, do nothing
        }

        if (req.method === 'GET') {
          const _data = await db.get(key) || '';
          res.setHeader('X-Version', _meta.version.toString());
          if (_meta.exists) {
            res.statusCode = 200;
            res.statusMessage = 'OK';
            res.setHeader('Content-Type', _meta.contentType || 'application/octet-stream');
            res.write(_data);
            res.end();
            return;
          }
          res.statusCode = 404;
          res.statusMessage = 'Not Found';
          res.setHeader('Content-Type', 'text/plain');
          res.write(res.statusMessage);
          res.end();
          return;
        }

        if (req.method === 'PUT') {
          const bodyChunks: Buffer[] = [];
          req.on('data', chunk => bodyChunks.push(Buffer.from(chunk)));
          req.on('end', async () => {
            const body = Buffer.concat(bodyChunks);
            _meta.version++;
            _meta.exists = true;
            _meta.contentType = req.headers['content-type'] || 'application/octet-stream';
            await meta.put(key, _meta);
            await db.put(key, body.toString());
            res.write(_meta.version.toString());
            res.end();
          });
          return;
        }

        if (req.method === 'DELETE') {
          _meta.version++;
          _meta.exists = false;
          await meta.put(key, _meta);
          await db.del(key);
          res.write(_meta.version.toString());
          res.end();
          return;
        }

        res.write(`Hello there: ${req.method}:${req.url}`);
        res.end();
      });

      await new Promise<void>((resolve,reject) => {
        // @ts-ignore stfu
        server.listen(opts.port, '0.0.0.0', (err: Error|null) => {
          if (err) return reject(err);
          console.log(`keveat listening on :${opts.port}`);
          resolve();
        });
      });



//       const app = fastify();
//       app.addHttpMethod('MKCOL', { hasBody: true });
//       app.register(routerPlugin, controllers);

//       if (opts.ui) {
//         app.get('/', (req: FastifyRequest, res: FastifyReply) => {
//           res.redirect('/ui/', 301);
//         });
//         app.register(require('@fastify/static'), {
//           root: path.join(__dirname, '..', '..', '..', 'frontend', 'dist'),
//           prefix: '/ui/',
//         });
//       }



//       await new Promise<void>(done => {
//         app.listen({ port: parseInt(opts.port) }, (err: Error | null, addr: string) => {
//           if (err) throw err;
//           console.log(`Backend listening on ${addr}`);
//           done();
//         });
//       });

//       // Update meta whenever mutations happen
//       db.hooks.prewrite.add(async function(op, batch) {
//         const _key  = op.key;
//         const _meta = (await meta.get(_key) || { Version: 0, Exists: false }) as Meta;
//         _meta.Version++;
//         if ('put' === op.type) {
//           _meta.Exists = true;
//         } else if ('del' === op.type) {
//           _meta.Exists = false;
//         } else {
//           throw new Error(`Unsupported operation: ${op.type}`);
//         }
//         await meta.put(_key, _meta);
//       });

    })
    ;
};
