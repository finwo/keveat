import {Controller, Delete, Get, Options, Put, Req, Res} from "@finwo/router";
import {FastifyReply, FastifyRequest} from "fastify";
import {db} from "../db";

@Controller('/v1/sync')
export default class SyncController {

//   @Get('*')
//   async getRoute(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
//     const params = req.params as { '*': string };
//     const key    = '/' + params['*'].split('/').filter(Boolean).join('/');
//     const result = await db.get(key);
//     return {
//       method: 'get',
//       key,
//       result,
//     };
//   }

//   @Options('*')
//   async optionsRoute(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
//     const params = req.params as { '*': string };
//     const key    = '/' + params['*'].split('/').filter(Boolean).join('/');
//     const sep    = key === '/' ? '' : '/';
//     const foundKeys: string[] = [];
//     // Iterate entries with keys that are greater than 'a'
//     for await (const [foundKey,_] of db.iterator({
//       gte: `${key}${sep}\x00\x00\x00\x00`,
//       lte: `${key}${sep}\xff\xff\xff\xff`,
//       keys: true,
//       values: false
//     })) {
//       foundKeys.push(foundKey);
//     }
//     return {
//       method: 'options',
//       key,
//       foundKeys,
//     };
//   }

//   @Put('*')
//   async putRoute(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
//     // write to key
//     const params = req.params as { '*': string };
//     const key    = '/' + params['*'].split('/').filter(Boolean).join('/');
//     const value  = req.body;
//     const result = await db.put(key, value as string);
//     return {
//       method: 'put',
//       key,
//       value,
//       result
//     };
//   }

//   @Delete('*')
//   async deleteRoute(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
//     // delete key
//     const params = req.params as { '*': string };
//     const key    = '/' + params['*'].split('/').filter(Boolean).join('/');
//     const result = await db.del(key);
//     return {
//       method: 'delete',
//       key,
//       result,
//     };
//   }

}





