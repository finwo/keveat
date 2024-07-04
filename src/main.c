#ifdef __cplusplus
extern "C" {
#endif

#include <stdio.h>
#include <string.h>

#include "cofyc/argparse.h"
#include "rxi/log.h"

#include "ChunkModule/setup.h"
#include "CliModule/setup.h"
#include "CliModule/execute_command.h"

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
    OPT_STRING('v', "verbosity", &loglevel, "log verbosity: fatal,error,warn,info,debug,trace (default: info)", NULL, 0, 0),
    OPT_END(),
  };
  argparse_init(&argparse, options, usages, ARGPARSE_STOP_AT_NON_OPTION);
  argc = argparse_parse(&argparse, argc, argv);
  if (argc < 1) {
    argparse_usage(&argparse);
    return 1;
  }

  if (0) {
    // Intentionally empty
  } else if (!strcasecmp(loglevel, "trace")) {
    log_set_level(LOG_TRACE);
  } else if (!strcasecmp(loglevel, "debug")) {
    log_set_level(LOG_DEBUG);
  } else if (!strcasecmp(loglevel, "info")) {
    log_set_level(LOG_INFO);
  } else if (!strcasecmp(loglevel, "warn")) {
    log_set_level(LOG_WARN);
  } else if (!strcasecmp(loglevel, "error")) {
    log_set_level(LOG_ERROR);
  } else if (!strcasecmp(loglevel, "fatal")) {
    log_set_level(LOG_FATAL);
  } else {
    fprintf(stderr, "Unknown log level: %s\n", loglevel);
    return 1;
  }

  // Pass control over to the CliModule
  return climodule_execute_command(argc, argv);
}

#ifdef __cplusplus
} // extern "C"
#endif
