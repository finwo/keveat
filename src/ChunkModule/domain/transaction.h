#ifndef __CHUNKMODULE_DOMAIN_TRANSACTION_H__
#define __CHUNKMODULE_DOMAIN_TRANSACTION_H__

#include <stdint.h>

#include "finwo/palloc.h"
#include "tidwall/buf.h"

#include "common.h"

struct kvsm_transaction_entry_t {
  struct buf key;
  struct buf value;
};

struct kvsm_transaction_t {
  PALLOC_OFFSET                    offset;
  PALLOC_OFFSET                    parent;
  uint64_t                         increment;
  uint64_t                         timestamp;
  uint16_t                         header_length;
  unsigned int                     entry_count;
  struct kvsm_transaction_entry_t *entry;
};

struct kvsm_transaction_t * kvsm_transaction_init();
struct buf *                kvsm_transaction_get(struct kvsm_transaction_t *, const struct buf *);
void                        kvsm_transaction_set(struct kvsm_transaction_t *, const struct buf *, const struct buf *);
void                        kvsm_transaction_del(struct kvsm_transaction_t *, const struct buf *);
void                        kvsm_transaction_copy_records(struct kvsm_transaction_t *, struct kvsm_transaction_t *);
void                        kvsm_transaction_free(struct kvsm_transaction_t *);

// Caution: does NOT load entries
struct kvsm_transaction_t * kvsm_transaction_load(PALLOC_OFFSET);

void kvsm_transaction_store(struct kvsm_transaction_t *);

#endif // __CHUNKMODULE_DOMAIN_TRANSACTION_H__
