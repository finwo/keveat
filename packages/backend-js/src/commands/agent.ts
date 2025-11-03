import {Level} from "level";
import http, {IncomingMessage, ServerResponse} from 'node:http';
import {Command} from "commander"
import {env} from "../env";
import morgan from 'morgan';

import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';

import {AuthPolicy, AuthPolicyAction, Meta} from "../common";
import {Stats} from 'node:fs';
import { lookup as getMime } from 'mime-types';
import {createHash, createHmac} from "crypto";

import qs from 'node:querystring';
import globToRegex from "../common/util/glob-to-regex";

type CommandOptions = {
  clusterKey: string;
  ui: boolean;
  port: string;
  peer: string[];
  dataDir: string;
};

type AuthInfo = {
  identifier: string;
  policies: AuthPolicy[];
  roles: string[];
};

const buildList = (item: string, list: string[]) => [...(list ?? []), ...item.split(',')]

const staticDir    = path.resolve(__dirname, '..', '..', '..', 'frontend', 'dist');
const staticPrefix = '/ui';
const staticIndex  = 'index.html';

const authWindow = 60;

function checkPolicies(policies: AuthPolicy[], key: string, action: AuthPolicyAction) {
  if (action === 'deny') return false;
  for(const policy of policies) {
    const matches = policy.targetRegex.exec(key);
    if (!matches) continue;
    if (policy.action === 'deny') return false;
    if (policy.action === 'write') return true;
    if (policy.action === 'read' && action === 'read') return true;
    if (policy.action === 'read' && action === 'write') return false;
    return false;
  }
  return false;
}

export default function(program: Command) {
  program
    .command('agent')
    .description('Start the agent')
    .requiredOption('--cluster-key <key>', 'Set the keypair for the cluster')
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

        let   body: Buffer = Buffer.alloc(0);
        const bodyChunks: Buffer[] = [];
        let   bodyDone: (_:Buffer)=>void;
        // @ts-ignore stfu
        if (['PUT'].includes(req.method||'GET')) {
          const bodyPromise = new Promise<Buffer>(done => bodyDone = done);
          req.on('data', chunk => bodyChunks.push(Buffer.from(chunk)));
          req.on('end', () => bodyDone(Buffer.concat(bodyChunks)));
          body = await bodyPromise;
        }

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
            if (url.pathname === staticPrefix && staticPrefix.slice(-1) !== '/') {
              res.statusCode = 302;
              res.setHeader('Location', staticPrefix+'/');
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

        // Default token
        const auth: AuthInfo = Object.assign({
          identifier: 'anonymous',
          policies: [
            { target: '**', action: 'deny' },
          ],
          roles: [],
        }, JSON.parse(await db.get('/acl/token/anonymous') || '{}'));

        // Fetch token info
        if (req.headers.authorization) {
          let [authMethod, authArgument] = req.headers.authorization.split(' ');
          authMethod = authMethod.toLowerCase();
          switch(authMethod) {
            case 'anonymous':
              // Intentionally empty
              break;
            case 'basic':
              const [identifier,tstamp,...signatureTokens] = Buffer.from(authArgument,'base64').toString().split(':');
              const signature = signatureTokens.join(':');

              // timestamp must be within window
              const now = Math.floor(Date.now());
              if (Math.abs((parseInt(tstamp)|0) - now) > authWindow) {
                res.statusCode = 403;
                res.write(res.statusMessage = 'Permission Denied');
                return res.end();
              }

              let token;
              if (identifier === '_') {
                // cluster key
                token = {
                  secret: opts.clusterKey,
                  policies: [
                    { target: '**', action: 'write' },
                  ],
                };
              } else {
                token = JSON.parse(await db.get(`/acl/token/${identifier}`) || '{}');
              }

              // Validate signature:
              const authversion = req.headers['x-version'] || '';
              const bodyhash = body.length ? createHash('sha256').update(body).digest('base64') : '';
              const signdata = `${tstamp}:${req.method}${url.pathname}:${authversion}:${bodyhash}`;
              const signatureReference = createHmac('sha256', token.secret||'').update(signdata).digest('base64');
              if (signature !== signatureReference) {
                res.statusCode = 403;
                res.write(res.statusMessage = 'Permission Denied');
                return res.end();
              }

              // Override anonymous token with validate one
              Object.assign(auth, token);
              break;
          }
        }

        // Hydrate roles into auth.policies
        for(const roleName of auth.roles) {
          const role = JSON.parse(await db.get(`/acl/role/${roleName}`) || '{}');
          for(const policy of (role.policies||[])) {
            auth.policies.push(policy);
          }
        }

        // Pre-compile policies into regexes
        for(const policy of auth.policies) {
          policy.targetRegex = globToRegex(policy.target, {
            globstar: true,
            extended: true,
          });
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

            if (checkPolicies(auth.policies, foundKey, 'read')) {
              res.write(`${foundKey}\n`);
            }

          }
          return res.end();
        }

        const _meta = (await meta.get(key) || { version: 0, exists: false, contentType: null }) as Meta;

        if (req.method === 'GET' || req.method === 'HEAD') {

          if (!checkPolicies(auth.policies, key, 'read')) {
            res.statusCode = 403;
            res.write(res.statusMessage = 'Permission Denied');
            return res.end();
          }

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

          if (!checkPolicies(auth.policies, key, 'write')) {
            res.statusCode = 403;
            res.write(res.statusMessage = 'Permission Denied');
            return res.end();
          }

          let versionHeader = req.headers['x-version'] || [];
          if (Array.isArray(versionHeader)) versionHeader = versionHeader.join('');
          let givenVersion = parseInt(versionHeader);
          const newVersion = givenVersion || (_meta.version+1);
          if (newVersion <= _meta.version) {
            res.statusCode = 409;
            res.statusMessage = 'Conflict';
            return res.end();
          }

          // Update local db
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
                // @ts-ignore stfu
                body,
              });
            }
          }

          return;
        }

        if (req.method === 'DELETE') {

          if (!checkPolicies(auth.policies, key, 'write')) {
            res.statusCode = 403;
            res.write(res.statusMessage = 'Permission Denied');
            return res.end();
          }

          _meta.version++;
          _meta.exists = false;
          await meta.put(key, _meta);
          await db.del(key);
          res.write(_meta.version.toString());
          return res.end();
        }

        res.statusCode = 400;
        res.write(res.statusMessage = 'Bad Request');
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

    })
    ;
};
