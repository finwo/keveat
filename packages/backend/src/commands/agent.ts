import {Level} from "level";
import http, {IncomingMessage, ServerResponse} from 'node:http';
import {Command} from "commander"
import {env} from "../env";
import morgan from 'morgan';

import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';

import {Meta} from "../common/types";
import {Stats} from 'node:fs';
import { lookup as getMime } from 'mime-types';

import qs from 'node:querystring';

type CommandOptions = {
  clusterKey: string;
  ui: boolean;
  port: string;
  peer: string[];
  dataDir: string;
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
    .option('--data-dir <path>', 'Where to store data', 'data')
    .option('--port <port>', 'Set the port to listen on', `${env.PORT}`)
    .option('--ui', 'Enable the webui', false)
    .option('--peer <address>', 'Add a remote peer', buildList, [])
    .action(async (opts: CommandOptions) => {
      const dataDir = path.resolve(opts.dataDir);
      const root    = new Level(dataDir, { valueEncoding: 'utf8' });
      const db      = root.sublevel<string, string>('data', {})
      const meta    = root.sublevel<string, Meta>('meta', { valueEncoding: 'json' })

      const logger = morgan('tiny');

      const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
        await new Promise(done => logger(req, res, done));
        res.setHeader('Connection', 'close');

        // const url = req.url||'/';
        const url = new URL(req.url||'/', `http://127.0.0.1:${opts.port}`);
        const query = Object
          .entries(qs.decode((url.search||'?').slice(1)))
          .map(([key, value]: [string,any]) => {
            if (value === '') return [key,true];
            return [key,value];
          })
          .reduce((r: Record<string, any>, [key,value]) => {
            r[key] = value;
            return r;
          }, {})
          ;

        if (opts.ui) {
          if (url.pathname.startsWith(staticPrefix)) {
            // Handle OPTIONS
            if (req.method === 'OPTIONS') {
              res.setHeader('Allow', 'GET, OPTIONS');
              return res.end();
            }
            // Only GET
            if (req.method !== 'GET') {
              res.statusCode = 405;
              res.write(res.statusMessage = 'Method Not Allowed');
              return res.end();
            }
            // Basic static server
            let relative = (url.pathname||'/').slice(staticPrefix.length) || '/';
            if (relative.slice(-1) === '/') relative += staticIndex;
            let target = path.join(staticDir, relative);
            if (!target.startsWith(staticDir)) {
              res.statusCode = 404;
              res.write(res.statusMessage = 'Not Found');
              return res.end();
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
              return res.end();
            }
            res.setHeader('Content-Type', getMime(target) || 'application/octet-stream')
            const readstream = createReadStream(target);
            readstream.on('data', chunk => res.write(chunk));
            readstream.on('end', () => { readstream.close(); res.end(); });
            return;
          }
        }

        if (req.method === 'OPTIONS') {
          res.setHeader('Allow', 'OPTIONS, HEAD, GET, PUT, DELETE');
          return res.end();
        }

        const key = url.pathname;
        if (!key) {
          res.statusCode = 400;
          res.statusMessage = 'Bad Request';
          return res.end();
        }

        if (query.keys && (req.method === 'GET' || req.method === 'HEAD')) {
          res.setHeader('Content-Type', 'text/plain');
          if (req.method === 'HEAD') return res.end();
          for await (const [foundKey,_] of meta.iterator({
            gte: `${key}`,
            lte: `${key}\xFF\xFF\xFF\xFF`,
            keys: true,
            values: false
          })) {
            res.write(`${foundKey}\n`);
          }
          return res.end();
        }

        const _meta = (await meta.get(key) || { version: 0, exists: false, contentType: null }) as Meta;

        if (req.method === 'GET' || req.method === 'HEAD') {
          res.setHeader('X-Version', _meta.version.toString());
          if (_meta.exists) {
            res.statusCode = 200;
            res.statusMessage = 'OK';
            res.setHeader('Content-Type', _meta.contentType || 'application/octet-stream');
            if (req.method === 'GET') res.write(await db.get(key) || '');
            return res.end();
          }
          res.statusCode = 404;
          res.statusMessage = 'Not Found';
          res.setHeader('Content-Type', 'text/plain');
          if (req.method === 'GET') res.write(res.statusMessage);
          return res.end();
        }

        if (req.method === 'PUT') {
          const bodyChunks: Buffer[] = [];

          let versionHeader = req.headers['x-version'] || [];
          if (Array.isArray(versionHeader)) versionHeader = versionHeader.join('');
          let givenVersion = parseInt(versionHeader);
          const newVersion = givenVersion || (_meta.version+1);
          if (newVersion <= _meta.version) {
            res.statusCode = 409;
            res.statusMessage = 'Conflict';
            return res.end();
          }

          req.on('data', chunk => bodyChunks.push(Buffer.from(chunk)));
          req.on('end', async () => {

            // Update local db
            const body = Buffer.concat(bodyChunks);
            _meta.version = newVersion;
            _meta.exists = true;
            _meta.contentType = req.headers['content-type'] || 'application/octet-stream';
            await meta.put(key, _meta);
            await db.put(key, body.toString());
            res.write(_meta.version.toString());
            res.end();

            // Send updates to peers
            for(const peer of opts.peer) {
              const remoteResponse = await fetch(`${peer}${key}`, {
                method: 'HEAD',
              });
              if (!remoteResponse.headers.has('x-version')) {
                // Not a peer
                continue;
              }
              let remoteVersion = parseInt(remoteResponse.headers.get('x-version') || '0');
              if (remoteVersion < _meta.version) {
                await fetch(`${peer}${key}`, {
                  method: 'PUT',
                  headers: {
                    'X-Version': _meta.version.toString(),
                  },
                  body,
                });
              }
            }

          });
          return;
        }

        if (req.method === 'DELETE') {
          _meta.version++;
          _meta.exists = false;
          await meta.put(key, _meta);
          await db.del(key);
          res.write(_meta.version.toString());
          return res.end();
        }

        res.write(`Hello there: ${req.method}:${req.url}`);
        return res.end();
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
