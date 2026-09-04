// Minimal structured logger for server-side visibility.
// Writes greppable single-line records to stdout/stderr, which Yandex Cloud
// surfaces in container logs. Adds a `[nf]` marker for easy filtering.
type Level = "info" | "warn" | "error";

function write(level: Level, context: string, msg: string, meta?: Record<string, unknown>) {
  const line: Record<string, unknown> = {
    t: new Date().toISOString(),
    level,
    context,
    msg,
    ...meta,
  };
  const text = `[nf:${level}] ${context}: ${msg}${meta?.err ? ` | err=${meta.err}` : ""}`;
  if (level === "error") console.error(text, meta?.err ? `\n${meta.err}` : "");
  else console.log(text);
  return line;
}

export const logInfo = (context: string, msg: string, meta?: Record<string, unknown>) => write("info", context, msg, meta);
export const logWarn = (context: string, msg: string, meta?: Record<string, unknown>) => write("warn", context, msg, meta);
export const logError = (context: string, msg: string, error?: unknown, meta?: Record<string, unknown>) =>
  write("error", context, msg, { err: error instanceof Error ? error.message : String(error), ...meta });
