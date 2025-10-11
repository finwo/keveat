import {Command} from "commander";
// import {randomBytes} from "crypto";

export default function(program: Command) {
  program
    .command('generate-key')
    .description('Generate a new cluster key')
    .action(async () => {
      // const key = randomBytes(32);
      // process.stderr.write(`\nNew key has been generated: `);
      // process.stdout.write(`${key.toString('hex')}\n`);
      // process.stderr.write(`\nTo use the key, use '--cluster-key <key>' on the agent\n\n`);
    })
    ;
};
