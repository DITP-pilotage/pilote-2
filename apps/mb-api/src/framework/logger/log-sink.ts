export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogEntry = {
  readonly level: LogLevel
  readonly timestamp: Date
  readonly message: string
  readonly context: Record<string, unknown>
}

export interface LogSink {
  write(entry: LogEntry): void
}
