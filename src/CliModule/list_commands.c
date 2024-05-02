#include <stdio.h>
#include <string.h>

#include "common.h"
#include "list_commands.h"

int climodule_cmd_list_commands(int argc, const char **argv) {

  // Detect name lenghts
  int name_longest = 0;
  int len;
  struct climodule_command *cmd = climodule_commands;
  while(cmd) {
    len = strlen(cmd->cmd);
    if (len > name_longest) { name_longest = len; }
    cmd = cmd->next;
  }

  // Print basic table
  printf("Available commands:\n\n");
  cmd = climodule_commands;
  while(cmd) {
    printf("  %*s  %s\n", name_longest, cmd->cmd, cmd->desc);
    cmd = cmd->next;
  }
  printf("\n");

  return 0;
}
