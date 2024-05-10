#include <stdio.h>
#include <string.h>

#include "get.h"
#include "finwo/http-parser.h"
#include "finwo/http-server.h"

void kvsm_http_get(struct http_server_reqdata *reqdata) {
  printf("Hello from GET\n");
  http_parser_header_set(reqdata->reqres->response, "Content-Type", "text/plain");
  reqdata->reqres->response->status     = 200;
  reqdata->reqres->response->body       = calloc(1, sizeof(struct buf));
  reqdata->reqres->response->body->data = calloc(512, 1);
  strcat(reqdata->reqres->response->body->data, "Hello there!\n");

  const char *key = http_parser_meta_get(reqdata->reqres->request, "param:key");
  if (key) {
    strcat(reqdata->reqres->response->body->data, "Key: ");
    strcat(reqdata->reqres->response->body->data, key);
    strcat(reqdata->reqres->response->body->data, "\n");
  }

  reqdata->reqres->response->body->len  = strlen(reqdata->reqres->response->body->data);
  http_server_response_send(reqdata, true);
  return;
}
