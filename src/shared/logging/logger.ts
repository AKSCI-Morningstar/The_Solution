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

const LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

function configuredLevel(): LogLevel {
  const value = process.env.LOG_LEVEL;
  return (LOG_LEVELS as string[]).includes(value ?? "") ? (value as LogLevel) : "info";
}

function shouldLog(level: LogLevel): boolean {
  if (isDev()) {
    return true;
  }
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(configuredLevel());
}

function write(entry: LogEntry): void {
  const sink =
    entry.level === "error" ? console.error : entry.level === "warn" ? console.warn : console.log;

  if (isDev()) {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    const details = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    sink(`${prefix}: ${entry.message}${details}`);
    return;
  }

  // Production: one JSON object per line, matched by most log aggregators (CloudWatch, Datadog, etc.)
  sink(JSON.stringify(entry));
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
