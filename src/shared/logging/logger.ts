type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const isDev = (): boolean => process.env.NODE_ENV === "development";

function createEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): LogEntry {
  return { level, message, timestamp: new Date().toISOString(), context };
}

function shouldLog(level: LogLevel): boolean {
  if (isDev()) {
    return true;
  }
  const envLevel: LogLevel = "info";
  const levels: LogLevel[] = ["debug", "info", "warn", "error"];
  return levels.indexOf(level) >= levels.indexOf(envLevel);
}

function write(entry: LogEntry): void {
  if (isDev()) {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    const details = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    switch (entry.level) {
      case "error":
        console.error(`${prefix}: ${entry.message}${details}`);
        break;
      case "warn":
        console.warn(`${prefix}: ${entry.message}${details}`);
        break;
      default:
        console.log(`${prefix}: ${entry.message}${details}`);
    }
  }
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (shouldLog("debug")) {
      write(createEntry("debug", message, context));
    }
  },

  info(message: string, context?: Record<string, unknown>): void {
    if (shouldLog("info")) {
      write(createEntry("info", message, context));
    }
  },

  warn(message: string, context?: Record<string, unknown>): void {
    if (shouldLog("warn")) {
      write(createEntry("warn", message, context));
    }
  },

  error(message: string, context?: Record<string, unknown>): void {
    if (shouldLog("error")) {
      write(createEntry("error", message, context));
    }
  },
};
