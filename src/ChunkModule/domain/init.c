#include <stdio.h>
#include <stdlib.h>

#include "ChunkModule/domain/transaction.h"
#include "LogModule/main.h"

#include "finwo/palloc.h"

#include "init.h"
#include "compact.h"

struct kvsm_state_t *kvsm_state = NULL;

void chunkmodule_domain_init(const char *storage, int isBlockDev) {
  PALLOC_FLAGS flags = PALLOC_DEFAULT;
  if (!isBlockDev) flags |= PALLOC_DYNAMIC;

  // Sanity checking
  if (kvsm_state) {
    log_error("Double-init not allowed\n");
    return;
  }
  if (!storage) {
    log_fatal("No chunk storage given, see --help\n");
    exit(1);
  }

  // Initialize blob storage
  log_info("Initializing blob storage...");
  kvsm_state     = calloc(1, sizeof(struct kvsm_state_t));
  kvsm_state->fd = palloc_open(storage, flags);
  if (!kvsm_state->fd) {
    log_fatal("Could not open storage: %s\n", storage);
    exit(1);
  }
  if (palloc_init(kvsm_state->fd, flags)) {
    log_fatal("Error during storage initialization: %s\n", storage);
    exit(1);
  }
  log_info("OK\n");

  // Find current main transaction
  log_info("Finding current head...");
  struct kvsm_transaction_t *tx = NULL;
  PALLOC_OFFSET off = palloc_next(kvsm_state->fd, 0);
  while(off) {
    tx = kvsm_transaction_load(off);
    if (!tx) goto init_lp;
    if (tx->increment > kvsm_state->root_txid) {
      kvsm_state->root_txid   = tx->increment;
      kvsm_state->root_offset = off;
    }
init_lp:
    if (tx) kvsm_transaction_free(tx);
    tx  = NULL;
    off = palloc_next(kvsm_state->fd, off);
  }
  if (kvsm_state->root_txid) {
    log_info("OK\n");
  } else {
    log_info("Not found\n");
  }

  kvsm_compact_increment(3);

  /* log_info("Writing mock data: foo = bar..."); */
  /* tx = kvsm_transaction_init(); */
  /* kvsm_transaction_set(tx, &((struct buf){ .data = "foo", .len = 3 }), &((struct buf){ .data = "bar", .len = 3 })); */
  /* kvsm_transaction_store(kvsm_state, tx); */
  /* kvsm_transaction_free(tx); */
  /* log_info("OK\n"); */

  /* log_info("Reading mock data: foo = bar..."); */
  /* tx = kvsm_transaction_init(); */
  /* struct buf *received = kvsm_transaction_get(tx, &((struct buf){ .data = "xxx", .len = 3 })); */
  /* kvsm_transaction_free(tx); */
  /* log_info("OK\n"); */

  /* if (received) printf("Received(%ld): %.*s\n", received->len, (int)(received->len), received->data); */

  // Done

  log_info("Initialization done\n");
}
