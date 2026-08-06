type LogLevel = "debug" | "info" | "warn" | "error";

const consoleMethod: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

function emit(level: LogLevel, scope: string, message: string, data?: unknown) {
  const prefix = `[clearfund:${scope}]`;
  if (data !== undefined) {
    consoleMethod[level](prefix, message, data);
  } else {
    consoleMethod[level](prefix, message);
  }
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, data?: unknown) => emit("debug", scope, message, data),
    info: (message: string, data?: unknown) => emit("info", scope, message, data),
    warn: (message: string, data?: unknown) => emit("warn", scope, message, data),
    error: (message: string, data?: unknown) => emit("error", scope, message, data),
  };
}
