import {Command} from "commander";
import {createSeed, KeyPair} from 'supercop';
import { randomBytes } from "crypto";

export default function(program: Command) {
  program
    .command('generate-key')
    .description('Generate a new cluster key')
    .action(async () => {
      const seed = randomBytes(32);
      const keypair = await KeyPair.create(seed);
      process.stderr.write(`\nNew keypair has been generated:\n`);
      process.stderr.write(`  Public key: `);
      process.stdout.write(`${keypair.publicKey?.toString('base64url')}`);
      process.stderr.write(`\n`);
      process.stderr.write(`  Secret key`);
      process.stdout.write(`:`);
      process.stderr.write(` `);
      process.stdout.write(`${keypair.secretKey?.toString('base64url')}\n`);
      process.stderr.write(`\nTo use the key, use '--cluster-key <public-key>:<secret-key>' on the agent\n\n`);
    })
    ;
};
