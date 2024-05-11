#ifdef __cplusplus
extern "C" {
#endif

#include <stdio.h>
#include <string.h>

#include "cofyc/argparse.h"

#include "ChunkModule/setup.h"
#include "CliModule/setup.h"
#include "CliModule/execute_command.h"
#include "LogModule/setup.h"

static const char *const usages[] = {
  "keveat [global] command [local]",
  "keveat list-commands",
  NULL,
};

int main(int argc, const char **argv) {
  const char *loglevel = "info";

  // Call module initializers here
  chunkmodule_setup();
  climodule_setup();

  // Parse global options
  struct argparse argparse;
  struct argparse_option options[] = {
    OPT_HELP(),
    OPT_STRING('l', "log", &loglevel, "loglevel fatal,error,warn,info,debug (default: info)", NULL, 0, 0),
    OPT_END(),
  };
  argparse_init(&argparse, options, usages, ARGPARSE_STOP_AT_NON_OPTION);
  argc = argparse_parse(&argparse, argc, argv);
  if (argc < 1) {
    argparse_usage(&argparse);
    return 1;
  }

  if (!strcmp(loglevel, "fatal")) log_verbosity = LOG_FATAL;
  else if (!strcmp(loglevel, "error")) log_verbosity = LOG_ERROR;
  else if (!strcmp(loglevel, "warn"))  log_verbosity = LOG_WARN;
  else if (!strcmp(loglevel, "info"))  log_verbosity = LOG_INFO;
  else if (!strcmp(loglevel, "debug")) log_verbosity = LOG_DEBUG;
  else {
    fprintf(stderr, "Unknown log level: %s\n", loglevel);
    return 1;
  }

  // Pass control over to the CliModule
  return climodule_execute_command(argc, argv);
}

#ifdef __cplusplus
} // extern "C"
#endif
