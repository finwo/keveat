/*#include <stdio.h>*/
/*#include <string.h>*/
/**/
/*#include "finwo/kvsm.h"*/
/*#include "get.h"*/
/*#include "finwo/http-parser.h"*/
/*#include "finwo/http-server.h"*/
/**/
/*void kvsm_http_get(struct http_server_reqdata *reqdata) {*/
/**/
/*  // No key = invalid request*/
/*  const char *key = http_parser_meta_get(reqdata->reqres->request, "param:key");*/
/*  if (!key) {*/
/*    http_parser_header_set(reqdata->reqres->response, "Content-Type", "application/json");*/
/*    reqdata->reqres->response->status     = 400;*/
/*    reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));*/
/*    reqdata->reqres->response->body->data = strdup("{\"ok\":false,\"error\":\"Missing key\"}");*/
/*    reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);*/
/*    return http_server_response_send(reqdata, true);*/
/*  }*/
/**/
/*  // Fetch from storage*/
/*  struct kvsm_transaction_t *tx = kvsm_transaction_init();*/
/*  struct buf *found = kvsm_transaction_get(tx, &((struct buf){ .data = (char *)key, .len = strlen(key) }));*/
/*  if (!found) {*/
/*    http_parser_header_set(reqdata->reqres->response, "Content-Type", "application/json");*/
/*    reqdata->reqres->response->status     = 404;*/
/*    reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));*/
/*    reqdata->reqres->response->body->data = strdup("{\"ok\":false,\"error\":\"Not found\"}");*/
/*    reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);*/
/*    return http_server_response_send(reqdata, true);*/
/*  }*/
/**/
/*  http_parser_header_set(reqdata->reqres->response, "Content-Type", "application/octet-stream");*/
/*  reqdata->reqres->response->status = 200;*/
/*  reqdata->reqres->response->body   = found;*/
/*  return http_server_response_send(reqdata, true);*/
/*}*/
