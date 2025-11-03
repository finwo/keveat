import {Command} from "commander";
// import {createSeed, KeyPair} from 'supercop';
// import { randomBytes } from "crypto";
// import base64url from 'base64url';

// type CommandOptions = {
//   clusterKey: string;
//   validDays?: string;
//   subject?: string;
// };

// type AclPolicy = {
//   sub: string;
//   act: 'allow' | 'deny';
// };

// type Claims = {
//   typ: string;
//   iat: number;
//   sub?: string;
//   exp?: number;
//   acl: AclPolicy[];
// }

export default function(program: Command) {
//   program
//     .command('generate-admin-token')
//     .description('Generate a new admin token')
//     .requiredOption('--cluster-key <keypair>', 'Set the keypair for the cluster')
//     .option('--subject <name>', 'Name the token')
//     .option('--valid-days <number>', 'How many days the token should be valid')
//     .action(async (opts: CommandOptions) => {

//       const [publicKey, secretKey] = opts.clusterKey.split(':') as [string,string];
//       const keypair = KeyPair.from({ publicKey: Buffer.from(publicKey, 'base64'), secretKey: Buffer.from(secretKey, 'base64') });

//       const claims: Claims = {
//         typ: 'token',
//         iat: Math.floor(Date.now() / 1000),
//         acl: [{ sub: '*', act: 'allow' }],
//       };
//       if (opts.validDays) {
//         claims.exp = claims.iat + (parseInt(opts.validDays) * 24 * 60 * 60);
//       }
//       if (opts.subject) {
//         claims.sub = `${opts.subject}`;
//       }

//       const claimString = base64url.encode(JSON.stringify(claims));
//       const signature   = base64url.encode(await keypair.sign(claimString));

//       process.stderr.write(`\nNew admin token has been generated:\n`);
//       process.stderr.write(`  `);
//       process.stdout.write(`${claimString}.${signature}\n`);
//       process.stderr.write(`\n`);
//     })
//     ;
};
