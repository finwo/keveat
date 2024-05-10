#include <stdio.h>

#include "chunk.h"

int chunkmodule_cmd_chunk(int argc, const char **argv) {
  printf("Hello from the chunkserver\n");
  return 0;
}
