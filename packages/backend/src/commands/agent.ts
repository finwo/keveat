import {Command} from "commander"
import { plugin as routerPlugin } from '@finwo/router-fastify';
import {env} from "../env";
import fastify, {FastifyReply, FastifyRequest} from "fastify";
import path from "path";
import {db,meta} from '../db';

import controllers from "../controllers";
import {Meta} from "../common/types";

type CommandOptions = {
  clusterKey: string;
  ui: boolean;
  port: string;
  peer: string[];
};

const buildList = (item: string, list: string[]) => [...(list ?? []), ...item.split(',')]

export default function(program: Command) {
  program
    .command('agent')
    .description('Start the agent')
    .requiredOption('--cluster-key <keypair>', 'Set the keypair for the cluster')
    .option('--port <port>', 'Set the port to listen on', `${env.PORT}`)
    .option('--ui', 'Enable the webui', false)
    .option('--peer <address>', 'Add a remote peer', buildList, [])
    .action(async (opts: CommandOptions) => {

      const app = fastify();
      app.addHttpMethod('MKCOL', { hasBody: true });
      app.register(routerPlugin, controllers);

      if (opts.ui) {
        app.get('/', (req: FastifyRequest, res: FastifyReply) => {
          res.redirect('/ui/', 301);
        });
        app.register(require('@fastify/static'), {
          root: path.join(__dirname, '..', '..', '..', 'frontend', 'dist'),
          prefix: '/ui/',
        });
      }

      await new Promise<void>(done => {
        app.listen({ port: parseInt(opts.port) }, (err: Error | null, addr: string) => {
          if (err) throw err;
          console.log(`Backend listening on ${addr}`);
          done();
        });
      });

      // Update meta whenever mutations happen
      db.hooks.prewrite.add(async function(op, batch) {
        const _key  = op.key;
        const _meta = (await meta.get(_key) || { Version: 0, Exists: false }) as Meta;
        _meta.Version++;
        if ('put' === op.type) {
          _meta.Exists = true;
        } else if ('del' === op.type) {
          _meta.Exists = false;
        } else {
          throw new Error(`Unsupported operation: ${op.type}`);
        }
        await meta.put(_key, _meta);
      });

    })
    ;
};
