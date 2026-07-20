import { prisma } from '@/framework/persistence/prisma'
import { type LogEntry, type LogLevel, type LogSink } from '@/framework/logger/log-sink'
import { ApplicationLogLevel } from '@/generated/prisma/enums'

const LEVEL_MAP: Record<LogLevel, ApplicationLogLevel> = {
  debug: ApplicationLogLevel.DEBUG,
  info: ApplicationLogLevel.INFO,
  warn: ApplicationLogLevel.WARN,
  error: ApplicationLogLevel.ERROR,
}

type StructuredContext = {
  requestId?: string
  source?: string
  dureeMs?: number
}

export class DatabaseSink implements LogSink {
  write(entry: LogEntry): void {
    const { requestId, source, dureeMs, ...rest } = entry.context as StructuredContext &
      Record<string, unknown>

    void prisma.applicationLog
      .create({
        data: {
          level: LEVEL_MAP[entry.level],
          message: entry.message,
          date: entry.timestamp,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- l'élargissement en `object` est requis pour l'entrée JSON de Prisma sous exactOptionalPropertyTypes
          ...(Object.keys(rest).length > 0 ? { contexte: rest as object } : {}),
          ...(source !== undefined ? { source } : {}),
          ...(dureeMs !== undefined ? { dureeMs } : {}),
          ...(requestId !== undefined ? { requestId } : {}),
        },
      })
      .catch(() => {
        // best-effort : un crash de la DB ne doit pas couler une requête.
        // l'autre sink (stdout) a déjà reçu l'entry.
      })
  }
}
