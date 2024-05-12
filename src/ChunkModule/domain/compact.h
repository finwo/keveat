#ifndef __CHUNKMODULE_DOMAIN_COMPACT_H__
#define __CHUNKMODULE_DOMAIN_COMPACT_H__

#include <stdint.h>

void kvsm_compact_time(uint64_t not_before);
void kvsm_compact_increment(uint64_t not_before);

#endif // __CHUNKMODULE_DOMAIN_COMPACT_H__
