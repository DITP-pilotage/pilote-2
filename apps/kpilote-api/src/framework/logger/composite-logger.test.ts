import { describe, expect, it, vi } from 'vitest'

import { CompositeLogger } from '@/framework/logger/composite-logger'
import { type LogEntry, type LogSink } from '@/framework/logger/log-sink'

const buildSink = () => {
  const write = vi.fn<(entry: LogEntry) => void>()
  const sink: LogSink = { write }
  return { sink, write }
}

describe('CompositeLogger', () => {
  it('dispatches each level call to every sink with the corresponding entry', () => {
    const a = buildSink()
    const b = buildSink()
    const logger = new CompositeLogger([a.sink, b.sink])

    logger.debug({ k: 'd' }, 'debug message')
    logger.info({ k: 'i' }, 'info message')
    logger.warn({ k: 'w' }, 'warn message')
    logger.error({ k: 'e' }, 'error message')

    for (const write of [a.write, b.write]) {
      expect(write).toHaveBeenCalledTimes(4)
      expect(write.mock.calls[0]?.[0]).toMatchObject({
        level: 'debug',
        message: 'debug message',
        context: { k: 'd' },
      })
      expect(write.mock.calls[1]?.[0]).toMatchObject({
        level: 'info',
        message: 'info message',
        context: { k: 'i' },
      })
      expect(write.mock.calls[2]?.[0]).toMatchObject({
        level: 'warn',
        message: 'warn message',
        context: { k: 'w' },
      })
      expect(write.mock.calls[3]?.[0]).toMatchObject({
        level: 'error',
        message: 'error message',
        context: { k: 'e' },
      })
    }
  })

  it('attaches a Date timestamp to every entry', () => {
    const { sink, write } = buildSink()
    const logger = new CompositeLogger([sink])

    logger.info({}, 'tick')

    const entry = write.mock.calls[0]?.[0]
    expect(entry?.timestamp).toBeInstanceOf(Date)
  })

  it('preserves the order of sinks', () => {
    const calls: string[] = []
    const a: LogSink = { write: () => calls.push('a') }
    const b: LogSink = { write: () => calls.push('b') }
    const c: LogSink = { write: () => calls.push('c') }

    new CompositeLogger([a, b, c]).info({}, 'msg')

    expect(calls).toEqual(['a', 'b', 'c'])
  })

  it('does not throw when no sink is configured', () => {
    const logger = new CompositeLogger([])
    expect(() => logger.info({}, 'msg')).not.toThrow()
  })
})
