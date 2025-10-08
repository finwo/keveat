import 'dotenv/config';
import { cleanEnv, num } from 'envalid';
import path from 'node:path';

const env = cleanEnv(process.env, {
  PORT: num({ default: 3000 }),
});

import { plugin as routerPlugin } from '@finwo/router-fastify';

import fastify, {FastifyReply, FastifyRequest} from 'fastify';

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

  app.listen({ port: env.PORT }, (err: Error | null, addr: string) => {
    if (err) throw err;
    console.log(`Backend listening on ${addr}`);
  });
})();
