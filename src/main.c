#ifdef __cplusplus
extern "C" {
#endif

#include <stdio.h>
#include "cofyc/argparse.h"

#include "AppModule/setup.h"
#include "CliModule/setup.h"
#include "CliModule/execute_command.h"

static const char *const usages[] = {
  "keveat [global] command [local]",
  "keveat list-commands",
  NULL,
};

int main(int argc, const char **argv) {

  // Call module initializers here
  appmodule_setup();
  climodule_setup();

  // Parse global options
  struct argparse argparse;
  struct argparse_option options[] = {
    OPT_HELP(),
    OPT_END(),
  };
  argparse_init(&argparse, options, usages, ARGPARSE_STOP_AT_NON_OPTION);
  argc = argparse_parse(&argparse, argc, argv);
  if (argc < 1) {
    argparse_usage(&argparse);
    return 1;
  }

  // Pass control over to the CliModule
  return climodule_execute_command(argc, argv);
}

#ifdef __cplusplus
} // extern "C"
#endif
