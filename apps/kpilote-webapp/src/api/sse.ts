import { type z } from 'zod'

const SSE_DATA_PREFIX = 'data:'

// Découpe un flux d'octets en lignes de texte non vides. Une ligne coupée entre
// deux morceaux du flux est recollée.
export async function* readLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      const lines = buffer.split(/\r?\n/)
      buffer = done ? '' : (lines.pop() ?? '')
      for (const line of lines) {
        if (line.trim() !== '') yield line
      }
      if (done) return
    }
  } finally {
    reader.releaseLock()
  }
}

// Lit un flux SSE dont chaque événement porte un JSON sur une ligne `data:`, validé
// par `schema`. Les autres lignes (commentaires `: ping`, `event:`, `id:`) sont ignorées.
export async function* readSseJson<T>({
  body,
  schema,
}: {
  body: ReadableStream<Uint8Array>
  schema: z.ZodType<T>
}): AsyncGenerator<T> {
  for await (const line of readLines(body)) {
    if (!line.startsWith(SSE_DATA_PREFIX)) continue
    yield schema.parse(JSON.parse(line.slice(SSE_DATA_PREFIX.length)))
  }
}
