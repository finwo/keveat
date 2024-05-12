#include <stdio.h>

#include "ChunkModule/domain/transaction.h"
#include "finwo/endian.h"
#include "finwo/io.h"
#include "finwo/palloc.h"

#include "compact.h"

// Cleans up all parents before transaction at offset
void _kvsm_compact_before(PALLOC_OFFSET off) {
  struct kvsm_transaction_t *tx = kvsm_transaction_load(off);
  if (!tx) return;

  // Clean up parent first
  if (tx->parent) {
    _kvsm_compact_before(tx->parent);
  }

  // Max 2 parents in list, fetch them
  struct kvsm_transaction_t *ours   = kvsm_transaction_load(tx->parent);
  struct kvsm_transaction_t *theirs = NULL;
  if (ours) theirs = kvsm_transaction_load(ours->parent);

  // No 2 parents, nothing to merge
  if (!theirs) {
    if (ours) kvsm_transaction_free(ours);
    kvsm_transaction_free(tx);
    return;
  }

  // Build a fresh transaction
  struct kvsm_transaction_t *fresh = kvsm_transaction_init();
  fresh->parent    = theirs->parent;
  fresh->increment = ours->increment;
  fresh->timestamp = ours->timestamp;

  // Copy old then new into fresh record
  kvsm_transaction_copy_records(fresh, theirs);
  kvsm_transaction_copy_records(fresh, ours  );

  // And store it
  kvsm_transaction_store(fresh);

  // Update chosen tx's parent
  // Does not update records because it's not hydrated
  tx->parent = fresh->offset;
  kvsm_transaction_store(tx);

  // Remove parent transactions from storage
  pfree(kvsm_state->fd, theirs->offset);
  pfree(kvsm_state->fd, ours->offset);

  printf("nbf: %llx", off);
  printf(", ours: %llx", ours->offset);
  printf(", theirs: %llx", theirs->offset);
  printf(", fresh: %llx", fresh->offset);
  printf("\n");

  kvsm_transaction_free(theirs);
  kvsm_transaction_free(ours);
  kvsm_transaction_free(fresh);
}

// Cleans up all parents before timestamp
void kvsm_compact_time(uint64_t not_before) {
  // TODO: implement
}

// Cleans up all parents before N increments deep
void kvsm_compact_increment(uint64_t not_before) {
  struct kvsm_transaction_t *tx = kvsm_transaction_load(kvsm_state->root_offset);
  if (!tx) return;
  PALLOC_OFFSET off;

  // Iterate through parents from the root
  while(--not_before >= 1) {
    if (!tx->parent) break;
    off = tx->parent;
    kvsm_transaction_free(tx);
    tx = kvsm_transaction_load(off);
  }

  if (tx) {
    _kvsm_compact_before(tx->offset);
    kvsm_transaction_free(tx);
  }
}

