import { program } from 'commander';
import commands from './commands';

program
  .name('keveat')
  .description('Distributed key-value engine')
  ;

for(const commandFactory of commands) {
  commandFactory(program);
}

program.parse();
