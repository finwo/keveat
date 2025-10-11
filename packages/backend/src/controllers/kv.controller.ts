// import {Controller, Delete, Get, Route, Put, Req, Res, Options} from "@finwo/router";
// import {FastifyReply, FastifyRequest} from "fastify";
// import {db,meta} from "../db";
// import {Meta} from "../common/types";

// @Controller('/v1/kv')
// export default class KVController {

//   @Get('*')
//   async getRoute(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
//     const params  = req.params as { '*': string };
//     const key     = '/' + params['*'].split('/').filter(Boolean).join('/');
//     const fullkey = '/kv' + key;
//     const _data = await db.get(fullkey) || '';
//     const _meta = (await meta.get(fullkey) || { Version: 0, Exists: false }) as Meta;
//     res.header('X-Version', _meta.Version.toString());
//     const sendBody = req.method !== 'HEAD';
//     if (_meta.Exists) {
//       res.status(200);
//       res.send(sendBody ? {
//         statusCode: 200,
//         value: Buffer.from(_data).toString('base64'),
//       } : undefined);
//     }
//     res.status(404);
//     res.send(sendBody ? {
//       statusCode: 404,
//       error: 'Not Found',
//       message: `Key '${key}' not found`,
//     } : undefined);
//   }

//   // @ts-ignore Custom http method
//   @Options('*')
//   async optionsRoute(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
//     const params = req.params as { '*': string };
//     const key    = '/' + params['*'].split('/').filter(Boolean).join('/');
//     const sep    = key === '/' ? '' : '/';
//     const foundKeys: string[] = [];
//     for await (const [foundKey,_] of db.iterator({
//       gte: `/kv${key}${sep}\x00\x00\x00\x00`,
//       lte: `/kv${key}${sep}\xff\xff\xff\xff`,
//       keys: true,
//       values: false
//     })) {
//       foundKeys.push(foundKey.slice(3));
//     }
//     return {
//       statusCode: 200,
//       keys: foundKeys,
//     };
//   }

//   @Put('*')
//   async putRoute(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
//     const params = req.params as { '*': string };
//     const key     = '/' + params['*'].split('/').filter(Boolean).join('/');
//     const fullkey = '/kv' + key;
//     const value   = req.body;
//     await db.put(fullkey, value as string);
//     return {
//       statusCode: 200,
//     };
//   }

//   @Delete('*')
//   async deleteRoute(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
//     const params = req.params as { '*': string };
//     const key    = '/' + params['*'].split('/').filter(Boolean).join('/');
//     await db.del('/kv' + key);
//     return {
//       statusCode: 200,
//     };
//   }

// }





