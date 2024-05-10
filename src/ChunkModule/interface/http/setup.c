#include <stdint.h>
#include <stdio.h>

#include "ChunkModule/interface/http/del.h"
#include "ChunkModule/interface/http/get.h"
#include "ChunkModule/interface/http/put.h"

#include "finwo/http-server.h"

void chunkmodule_interface_http_setup() {
  http_server_route("DELETE", "/kv/:key", kvsm_http_del);
  http_server_route("GET"   , "/kv/:key", kvsm_http_get);
  http_server_route("PUT"   , "/kv/:key", kvsm_http_put);
}
