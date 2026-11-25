import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { readLines, readSseJson } from '@/api/sse'

const streamOf = (chunks: string[]): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

const collect = async <T>(iterable: AsyncIterable<T>): Promise<T[]> => {
  const items: T[] = []
  for await (const item of iterable) items.push(item)
  return items
}

describe('readLines', () => {
  it('recolle une ligne coupée entre deux morceaux et saute les lignes vides', async () => {
    const lines = await collect(readLines(streamOf(['data: {"a"', ':1}\n\ndata: 2\r\n', 'fin'])))
    expect(lines).toEqual(['data: {"a":1}', 'data: 2', 'fin'])
  })
})

describe('readSseJson', () => {
  it('rend le JSON validé de chaque ligne `data:` et ignore les autres lignes', async () => {
    const body = streamOf(['data: {"n":1}\n\n: ping\n\nevent: x\ndata: {"n":2}\n\n'])
    const events = await collect(readSseJson({ body, schema: z.object({ n: z.number() }) }))
    expect(events).toEqual([{ n: 1 }, { n: 2 }])
  })
})
