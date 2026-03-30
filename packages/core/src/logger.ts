type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function createLogger(service: string, minLevel: LogLevel = 'info') {
  const minLevelNum = LOG_LEVELS[minLevel];

  function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (LOG_LEVELS[level] < minLevelNum) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { service, ...context },
    };

    const output = JSON.stringify(entry);

    if (level === 'error') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }

  return {
    debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
    info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
    warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
    error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  };
}

export type Logger = ReturnType<typeof createLogger>;
