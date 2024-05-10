#include <stdio.h>

#include "CliModule/register_command.h"

#include "setup.h"
#include "command/chunk.h"

/* void __attribute__ ((constructor)) chunkmodule_setup() { */
void chunkmodule_setup() {
  // printf("Hello World from chunkmodule setup\n");
  climodule_register_command(
    "chunk",
    "Starts a chunk-server without redundancy",
    chunkmodule_cmd_chunk
  );
}
