import { type Env } from '@/env'
import { CompositeLogger } from '@/framework/logger/composite-logger'
import { type LogSink } from '@/framework/logger/log-sink'
import { DatabaseSink } from '@/framework/logger/sinks/database.sink'
import { PinoStdoutSink } from '@/framework/logger/sinks/pino-stdout.sink'

export const buildLogger = (env: Env): CompositeLogger => {
  const sinks: LogSink[] = [new PinoStdoutSink(env)]
  if (env.LOG_TO_DATABASE) sinks.push(new DatabaseSink())
  return new CompositeLogger(sinks)
}
