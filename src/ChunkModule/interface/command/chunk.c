#include <stdio.h>
#include <string.h>

#include "finwo/fnet.h"
#include "finwo/http-parser.h"
#include "finwo/http-server.h"

#include "ChunkModule/interface/http/setup.h"

#include "chunk.h"

void onServing(char *addr, uint16_t port, void *udata) {
  printf("Serving at %s:%d\n", addr, port);
}

void route_404(struct http_server_reqdata *reqdata) {
  http_parser_header_set(reqdata->reqres->response, "Content-Type", "text/plain");
  reqdata->reqres->response->status     = 404;
  reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));
  reqdata->reqres->response->body->data = strdup("not found\n");
  reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);
  http_server_response_send(reqdata, true);
  return;
}

int chunkmodule_cmd_chunk(int argc, const char **argv) {
  printf("Hello from the chunkserver agent\n");
  chunkmodule_interface_http_setup();

  struct http_server_events evs = {
    .serving  = onServing,
    .close    = NULL,
    .notFound = route_404,
    .tick     = NULL,
  };
  struct http_server_opts opts = {
    .evs   = &evs,
    .addr  = "0.0.0.0",
    .port  = 8080,
    .udata = &opts,
  };

  /* // Launch network management thread */
  /* thd_thread thread; */
  /* thd_thread_detach(&thread, fnet_thread, NULL); */

  http_server_main(&opts);
  fnet_shutdown();

  /* thd_thread_join(&thread); */

  printf("Server has shut down\n");
  return 0;
}
