/*#include <stdio.h>*/
/*#include <string.h>*/
/**/
/*#include "ChunkModule/domain/transaction.h"*/
/*#include "put.h"*/
/*#include "finwo/http-parser.h"*/
/*#include "finwo/http-server.h"*/
/**/
/*void kvsm_http_put(struct http_server_reqdata *reqdata) {*/
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
/*  // TODO: reject non-plain encodings*/
/**/
/*  // No data = invalid request*/
/*  if (!reqdata->reqres->request->body->len) {*/
/*    http_parser_header_set(reqdata->reqres->response, "Content-Type", "application/json");*/
/*    reqdata->reqres->response->status     = 400;*/
/*    reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));*/
/*    reqdata->reqres->response->body->data = strdup("{\"ok\":false,\"error\":\"Missing body\"}");*/
/*    reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);*/
/*    return http_server_response_send(reqdata, true);*/
/*  }*/
/**/
/*  // Store*/
/*  struct kvsm_transaction_t *tx = kvsm_transaction_init();*/
/*  kvsm_transaction_set(tx, &((struct buf){ .data = (char *)key, .len = strlen(key) }), reqdata->reqres->request->body);*/
/*  kvsm_transaction_store(tx);*/
/**/
/*  // And return our success*/
/*  http_parser_header_set(reqdata->reqres->response, "Content-Type", "application/json");*/
/*  reqdata->reqres->response->status     = 200;*/
/*  reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));*/
/*  reqdata->reqres->response->body->data = strdup("{\"ok\":true}");*/
/*  reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);*/
/*  return http_server_response_send(reqdata, true);*/
/*}*/
