#include "CliModule/register_command.h"

#include "setup.h"
#include "interface/command/chunk.h"

/* void __attribute__ ((constructor)) chunkmodule_setup() { */
void chunkmodule_setup() {
  climodule_register_command(
    "chunk",
    "Starts a chunk-server agent",
    chunkmodule_cmd_chunk
  );
}
