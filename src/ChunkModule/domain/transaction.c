#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include "LogModule/main.h"

#include "finwo/endian.h"
#include "finwo/io.h"
#include "tidwall/buf.h"

#include "common.h"
#include "transaction.h"

#if defined(_WIN32) || defined(_WIN64)
#include <sys/timeb.h>
#else
#include <sys/time.h>
#endif

int64_t _now() {
#if defined(_WIN32) || defined(_WIN64)
  struct _timeb timebuffer;
  _ftime(&timebuffer);
  return (int64_t)(((timebuffer.time * 1000) + timebuffer.millitm));
#else
  struct timeval tv;
  gettimeofday(&tv, NULL);
  return (tv.tv_sec * ((int64_t)1000)) + (tv.tv_usec / 1000);
#endif
}

struct kvsm_transaction_t * kvsm_transaction_init() {
  struct kvsm_transaction_t *tx = calloc(1, sizeof(struct kvsm_transaction_t));
  return tx;
}

// Caution: does NOT load entries
struct kvsm_transaction_t * kvsm_transaction_load(PALLOC_FD fd, PALLOC_OFFSET offset) {
  struct kvsm_transaction_t *tx;
  uint8_t version = 0;
  uint16_t header_length = 0;

  // No offset = no transaction
  if (!offset) return NULL;

  seek_os(fd, offset, SEEK_SET);
  read_os(fd, &version, sizeof(version));
  header_length += sizeof(version);

  // We only support version 0 for now
  if (version != 0) {
    log_fatal("Unsupported transaction at 0x%llx: invalid version\n", offset);
    exit(1);
  }

  // Load up remainder of the transaction
  tx         = kvsm_transaction_init();
  tx->offset = offset;
  read_os(fd, &(tx->increment), sizeof(uint64_t));
  tx->increment = be64toh(tx->increment);
  read_os(fd, &(tx->parent), sizeof(uint64_t));
  tx->parent = be64toh(tx->parent);
  read_os(fd, &(tx->timestamp), sizeof(uint64_t));
  tx->timestamp = be64toh(tx->timestamp);

  header_length     += 3 * sizeof(uint64_t);
  tx->header_length  = header_length;

  return tx;
}

// Side-effect: updates kvsm_state
void kvsm_transaction_store(struct kvsm_state_t *st, struct kvsm_transaction_t *tx) {
  int i;
  uint8_t version  = 0;
  uint8_t end_list = 0;
  uint8_t len8     = 0;
  uint16_t len16   = 0;
  uint64_t len64   = 0;

  if (!tx->increment) {
    tx->increment = kvsm_state->root_txid + 1;
    tx->parent    = kvsm_state->root_offset;
    tx->timestamp = _now();
  }


  // "calculate" serialized transaction length
  uint64_t txlen = 0;
  txlen += 1;  // version = 0
  txlen += sizeof(tx->increment);
  txlen += sizeof(tx->parent   );
  txlen += sizeof(tx->timestamp);
  for( i = 0 ; i < tx->entry_count ; i++ ) {
    if (tx->entry[i].key.len > 127) { txlen += 2; } else { txlen += 1; } // key length indicator
    txlen += tx->entry[i].key.len;
    txlen += sizeof(uint64_t);
    txlen += tx->entry[i].value.len;
  }
  txlen += 1; // End of record list

  // Prep data
  tx->increment = htobe64(tx->increment);
  tx->parent    = htobe64(tx->parent   );
  tx->timestamp = htobe64(tx->timestamp);

  // Actually reserve space in storage
  tx->offset = palloc(st->fd, txlen);

  // Write the transaction header
  seek_os( st->fd, tx->offset, SEEK_SET);
  write_os(st->fd, &version, sizeof(version));
  write_os(st->fd, &(tx->increment), sizeof(tx->increment));
  write_os(st->fd, &(tx->parent   ), sizeof(tx->parent   ));
  write_os(st->fd, &(tx->timestamp), sizeof(tx->timestamp));
  for( i = 0 ; i < tx->entry_count ; i++ ) {
    if (tx->entry[i].key.len > 127) {
      len16 = htobe16(32768 | tx->entry[i].key.len);
      write_os(st->fd, &len16, sizeof(len16));
    } else {
      len8 = tx->entry[i].key.len;
      write_os(st->fd, &len8, sizeof(len8));
    }
    write_os(st->fd, tx->entry[i].key.data, tx->entry[i].key.len);
    len64 = htobe64(tx->entry[i].value.len);
    write_os(st->fd, &len64, sizeof(len64));
    write_os(st->fd, tx->entry[i].value.data, tx->entry[i].value.len);
  }
  write_os(st->fd, &end_list, sizeof(end_list));

  // Revert data
  tx->increment = be64toh(tx->increment);
  tx->parent    = be64toh(tx->parent   );
  tx->timestamp = be64toh(tx->timestamp);
}

  /* Simple entry layout */
  /*   <version> - 1 byte */
  /*     1 bit  -> extended (tbd, not supported = error) */
  /*     7 bits -> version number */
  /*   <increment> */
  /*     64-bit number, increases by 1 for every update */
  /*   <parent> */
  /*     64-bit offset, reference to previous transaction */
  /*   <timestamp> */
  /*     64-bit unix timestamp in milliseconds */
  /*   <record> */
  /*     <null> = EOL */
  /*     <length-prefix string>: key */
  /*     <64-bit data length indicator> */
  /*     n-bytes data */


void kvsm_transaction_free(struct kvsm_transaction_t *tx) {
  unsigned int i;
  struct kvsm_transaction_entry_t *entry;

  // Assumes entry_count and entry are properly tracked
  if (tx->entry_count) {
    for( i = 0 ; i < tx->entry_count ; i++ ) {
      entry = &(tx->entry[i]);
      buf_clear(&(entry->key))  ;
      buf_clear(&(entry->value));
      // DO NOT free entry itself
    }
  }
  if (tx->entry) {
    free(tx->entry);
  }

  free(tx);
}

// Empty-value = tombstone
void kvsm_transaction_del(struct kvsm_transaction_t *tx, const struct buf *key) {
  return kvsm_transaction_set(tx, key, &((struct buf){ .len = 0, .cap = 0 }));
}

void kvsm_transaction_set(struct kvsm_transaction_t *tx, const struct buf *key, const struct buf *value) {
  if (!tx->entry) { tx->entry = malloc(1); }; // TODO: make nice
  tx->entry = realloc(tx->entry, sizeof(struct kvsm_transaction_entry_t)*(tx->entry_count + 1));
  memset(&(tx->entry[tx->entry_count]), 0, sizeof(struct kvsm_transaction_entry_t));
  buf_append(&(tx->entry[tx->entry_count].key  ), key->data, key->len);
  buf_append(&(tx->entry[tx->entry_count].value), value->data, value->len);
  tx->entry_count++;
}

struct buf * kvsm_transaction_get(struct kvsm_transaction_t *tx, const struct buf *key) {
  struct kvsm_transaction_t *vtx;
  PALLOC_OFFSET off;
  struct buf *current_value = calloc(1, sizeof(struct buf));
  struct buf *current_key  = calloc(1, sizeof(struct buf));
  uint8_t len8;
  uint16_t len16;
  uint64_t len64;

  // Lock transaction to an increment
  if (!tx->increment) {
    tx->increment = kvsm_state->root_txid;
    tx->offset    = kvsm_state->root_offset;
  }

  // Freshly load the transaction from storage
  vtx = kvsm_transaction_load(kvsm_state->fd, tx->offset);
  while(vtx) {
    off = vtx->offset + vtx->header_length;

    // Go to the transaction's entry list
    seek_os(kvsm_state->fd, off, SEEK_SET);

    // Iterate over all values
    while(1) {

      // Read current key length
      // 0 = end of list
      read_os(kvsm_state->fd, &len8, sizeof(len8));
      if (len8 == 0) break;
      if (len8 & 128) {
        len16 = (len8 & 127) << 8;
        read_os(kvsm_state->fd, &len8, sizeof(len8));
        len16 |= len8;
      } else {
        len16 = len8;
      }

      // Not length-matching = skip
      if (len16 != key->len) {
        seek_os(kvsm_state->fd, len16, SEEK_CUR);       // Skip key data
        read_os(kvsm_state->fd, &len64, sizeof(len64)); // Read value length
        len64 = be64toh(len64);
        seek_os(kvsm_state->fd, len16, SEEK_CUR);       // Skip value data
        continue;
      }

      // Read key data
      current_key->data = malloc(len16);
      current_key->len  = len16;
      read_os(kvsm_state->fd, current_key->data, len16);

      // Skip if key not matching
      if (memcmp(current_key->data, key->data, key->len)) {
        read_os(kvsm_state->fd, &len64, sizeof(len64)); // Read value length
        len64 = be64toh(len64);
        seek_os(kvsm_state->fd, len16, SEEK_CUR);       // Skip value data
        continue;
      }

      // Here = found
      read_os(kvsm_state->fd, &len64, sizeof(len64)); // Read value length
      current_value->len  = be64toh(len64);
      current_value->data = malloc(current_value->len);
      read_os(kvsm_state->fd, current_value->data, current_value->len);

      // Perform cleanup
      buf_clear(current_key);
      free(current_key);
      kvsm_transaction_free(vtx);

      // Return found value
      return current_value;
    }

    off = vtx->parent;
    kvsm_transaction_free(vtx);
    vtx = kvsm_transaction_load(kvsm_state->fd, off);
  }

  // Bail without data
  buf_clear(current_key);
  buf_clear(current_value);
  free(current_key);
  free(current_value);
  return NULL;
}

/* void                        kvsm_transaction_set(struct kvsm_transaction_t *, struct buf *, struct buf *); */
/* void                        kvsm_transaction_del(struct kvsm_transaction_t *, struct buf *); */


