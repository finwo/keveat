#ifndef __LOGMODULE_MAIN_H__
#define __LOGMODULE_MAIN_H__

#define LOG_FATAL 0
#define LOG_ERROR 1
#define LOG_WARN  2
#define LOG_INFO  3
#define LOG_DEBUG 4

extern int log_verbosity;

#define log_dynamic(level, args...) if (log_verbosity >= level) fprintf(stderr, args)
#define log_fatal(args...) log_dynamic(LOG_FATAL, args)
#define log_error(args...) log_dynamic(LOG_ERROR, args)
#define log_warn(args...)  log_dynamic(LOG_WARN , args)
#define log_info(args...)  log_dynamic(LOG_INFO , args)
#define log_debug(args...) log_dynamic(LOG_DEBUG, args)

#endif // __LOGMODULE_MAIN_H__
