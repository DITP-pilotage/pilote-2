import { type LogEntry, type LogLevel, type LogSink } from './log-sink'
import { type Logger } from './logger'

export class CompositeLogger implements Logger {
  constructor(private readonly sinks: ReadonlyArray<LogSink>) {}

  debug(context: Record<string, unknown>, message: string): void {
    this.emit('debug', context, message)
  }

  info(context: Record<string, unknown>, message: string): void {
    this.emit('info', context, message)
  }

  warn(context: Record<string, unknown>, message: string): void {
    this.emit('warn', context, message)
  }

  error(context: Record<string, unknown>, message: string): void {
    this.emit('error', context, message)
  }

  private emit(level: LogLevel, context: Record<string, unknown>, message: string): void {
    const entry: LogEntry = { level, timestamp: new Date(), message, context }
    for (const sink of this.sinks) sink.write(entry)
  }
}
