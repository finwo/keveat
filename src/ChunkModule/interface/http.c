#include <stdio.h>
#include <string.h>

#include "finwo/http-server.h"
#include "finwo/http-parser.h"
#include "finwo/kvsm.h"

#include "ChunkModule/state.h"

#include "http.h"

struct _routes {
  void *next;
  char *method;
  char *path;
  void (*fn)(struct http_server_reqdata*);
};
struct _routes *routes = NULL;

/*#define MERGE(a,b) a ## b*/
/*#define ROUTE(method,path) \*/
/*  void MERGE(_route_handler_,(__LINE__)) (struct http_server_reqdata *reqdata); \*/
/*  void __attribute__ ((constructor)) MERGE(_route_register_,(__LINE__)-1) () { \*/
/*    http_server_route(method, path, MERGE(_route_handler_,(__LINE__)-2) ); \*/
/*  } \*/
/*  void MERGE(_route_,(__LINE__)-4) (struct http_server_reqdata *reqdata)*/

void _internal_server_error(struct http_server_reqdata *reqdata) {
  http_parser_header_set(reqdata->reqres->response, "Content-Type", "text/plain");
  reqdata->reqres->response->status     = 500;
  reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));
  reqdata->reqres->response->body->data = strdup("Internal server error");
  reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);
  return http_server_response_send(reqdata, true);
}

void kvsm_http_del(struct http_server_reqdata *reqdata) {
  if (!kvsm_ctx) return _internal_server_error(reqdata);

  // No key = invalid request
  const char *key = http_parser_meta_get(reqdata->reqres->request, "param:key");
  if (!key) {
    http_parser_header_set(reqdata->reqres->response, "Content-Type", "text/plain");
    reqdata->reqres->response->status     = 400;
    reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));
    reqdata->reqres->response->body->data = strdup("Bad request: missing key");
    reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);
    return http_server_response_send(reqdata, true);
  }

  // Store
  KVSM_RESPONSE resp = kvsm_del(kvsm_ctx, &((struct buf){ .data = (char *)key, .len = strlen(key) }));
  if (resp != KVSM_OK) {
    http_parser_header_set(reqdata->reqres->response, "Content-Type", "text/plain");
    reqdata->reqres->response->status     = 500;
    reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));
    reqdata->reqres->response->body->data = strdup("Internal server error");
    reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);
    return http_server_response_send(reqdata, true);
  }

  // And return our success
  http_parser_header_set(reqdata->reqres->response, "Content-Type", "text/plain");
  reqdata->reqres->response->status     = 200;
  reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));
  reqdata->reqres->response->body->data = strdup("ok");
  reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);
  return http_server_response_send(reqdata, true);
}

void kvsm_http_get(struct http_server_reqdata *reqdata) {
  if (!kvsm_ctx) return _internal_server_error(reqdata);

  // No key = invalid request
  const char *key = http_parser_meta_get(reqdata->reqres->request, "param:key");
  if (!key) {
    http_parser_header_set(reqdata->reqres->response, "Content-Type", "text/plain");
    reqdata->reqres->response->status     = 400;
    reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));
    reqdata->reqres->response->body->data = strdup("Bad request: missing key");
    reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);
    return http_server_response_send(reqdata, true);
  }

  // Fetch from storage
  struct buf *found = kvsm_get(kvsm_ctx, &((struct buf){ .data = (char *)key, .len = strlen(key) }));
  if (!found) {
    http_parser_header_set(reqdata->reqres->response, "Content-Type", "text/plain");
    reqdata->reqres->response->status     = 404;
    reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));
    reqdata->reqres->response->body->data = strdup("Not found");
    reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);
    return http_server_response_send(reqdata, true);
  }

  http_parser_header_set(reqdata->reqres->response, "Content-Type", "application/octet-stream");
  reqdata->reqres->response->status = 200;
  reqdata->reqres->response->body   = found;
  return http_server_response_send(reqdata, true);
}

void kvsm_http_put(struct http_server_reqdata *reqdata) {
  if (!kvsm_ctx) return _internal_server_error(reqdata);

  // No key = invalid request
  const char *key = http_parser_meta_get(reqdata->reqres->request, "param:key");
  if (!key) {
    http_parser_header_set(reqdata->reqres->response, "Content-Type", "text/plain");
    reqdata->reqres->response->status     = 400;
    reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));
    reqdata->reqres->response->body->data = strdup("Bad request: missing key");
    reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);
    return http_server_response_send(reqdata, true);
  }

  // No data = invalid request
  if (!reqdata->reqres->request->body->len) {
    http_parser_header_set(reqdata->reqres->response, "Content-Type", "text/plain");
    reqdata->reqres->response->status     = 400;
    reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));
    reqdata->reqres->response->body->data = strdup("Bad request: missing body");
    reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);
    return http_server_response_send(reqdata, true);
  }

  // Store
  KVSM_RESPONSE resp = kvsm_set(kvsm_ctx, &((struct buf){ .data = (char *)key, .len = strlen(key) }), reqdata->reqres->request->body);

  if (resp != KVSM_OK) {
    http_parser_header_set(reqdata->reqres->response, "Content-Type", "text/plain");
    reqdata->reqres->response->status     = 500;
    reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));
    reqdata->reqres->response->body->data = strdup("Internal server error");
    reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);
    return http_server_response_send(reqdata, true);
  }

  // And return our success
  http_parser_header_set(reqdata->reqres->response, "Content-Type", "text/plain");
  reqdata->reqres->response->status     = 200;
  reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));
  reqdata->reqres->response->body->data = strdup("ok");
  reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);
  return http_server_response_send(reqdata, true);
}

void chunkmodule_interface_http_setup() {
  http_server_route("DELETE", "/kv/:key", kvsm_http_del);
  http_server_route("GET"   , "/kv/:key", kvsm_http_get);
  http_server_route("PUT"   , "/kv/:key", kvsm_http_put);
}
