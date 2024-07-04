#include <stdio.h>
#include <string.h>

#include "ChunkModule/state.h"
#include "cofyc/argparse.h"
#include "finwo/kvsm.h"
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
  int port             = 8080;
  int blockdev         = 0;
  const char *filename = NULL;

  // Parse local options
  struct argparse argparse;
  struct argparse_option options[] = {
    OPT_HELP(),
    OPT_INTEGER('p', "port"    , &port    , "Port to listen on"                                               , NULL, 0, 0),
    OPT_STRING('s' , "storage" , &filename, "Path for chunk storage file or block device"                     , NULL, 0, 0),
    OPT_BOOLEAN('b', "blockdev", &blockdev, "Indicates the file is a block device, prevent dynamic allocation", NULL, 0, 0),
    OPT_END(),
  };
  argparse_init(&argparse, options, NULL, 0);
  argc = argparse_parse(&argparse, argc, argv);

  // Limit port to uint16
  if ((port <= 0) || (port > 65535)) {
    fprintf(stderr, "Invalid port: %d\n", port);
    return 1;
  }

  // We require a filename
  if (!filename) {
    fprintf(stderr, "Missing storage file\n");
    return 1;
  }

  struct http_server_events evs = {
    .serving  = onServing,
    .close    = NULL,
    .notFound = route_404,
    .tick     = NULL,
  };
  struct http_server_opts opts = {
    .evs   = &evs,
    .addr  = "0.0.0.0",
    .port  = port,
    .udata = &opts,
  };

  kvsm_ctx = kvsm_open(filename, blockdev);
  chunkmodule_interface_http_setup();
  http_server_main(&opts);
  fnet_shutdown();

  printf("Server has shut down\n");
  return 0;
}

