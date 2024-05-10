#include <stdio.h>
#include <stdlib.h>

#include "finwo/palloc.h"

#include "init.h"

struct kvsm_state_t *kvsm_state = NULL;

void chunkmodule_domain_init(const char *storage, int isBlockDev) {
  PALLOC_FLAGS flags = PALLOC_DEFAULT;
  if (!isBlockDev) flags |= PALLOC_DYNAMIC;

  if (kvsm_state) {
    fprintf(stderr, "Double-init not allowed\n");
    exit(1);
  }
  if (!storage) {
    fprintf(stderr, "No chunk storage given, see --help\n");
    exit(1);
  }

  kvsm_state     = calloc(1, sizeof(struct kvsm_state_t));
  kvsm_state->fd = palloc_open(storage, flags);
  if (!kvsm_state->fd) {
    fprintf(stderr, "Could not open storage: %s\n", storage);
    exit(1);
  }

  if (palloc_init(kvsm_state->fd, flags)) {
    fprintf(stderr, "Error during storage initialization: %s\n", storage);
    exit(1);
  }

  printf("Success\n");
}
