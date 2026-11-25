import { type PlanImportEvent } from '@pilote/kpilote-shared/valeurImport'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { streamPlanImport } from '@/api/planImport'
import { apiUrl, server } from '@/tests/server'

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

const tableau = { entetes: ['Département', '2023'], lignes: [['Ain', 1]] }
const events: PlanImportEvent[] = [
  { type: 'ETAPE', etape: { etape: 'STRUCTURE', statut: 'EN_COURS' } },
  {
    type: 'PLAN',
    plan: {
      individu: {
        colonne: 'Département',
        rapprochements: { Ain: { statut: 'RESOLU', publicId: 'DEPT-01', par: 'EXACT' } },
      },
      axes: [],
      valeurs: { disposition: 'COLONNES', colonnes: [{ colonne: '2023', date: '2023-01-01' }] },
    },
  },
]

describe('streamPlanImport', () => {
  it('rend les événements du flux SSE dans l’ordre, en ignorant ce qui n’est pas `data:`', async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl('/indicateurs/IND-1/valeurs:plan-import'), async ({ request }) => {
        bodies.push(await request.json())
        const sse = events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(': ping\n\n')
        return new HttpResponse(streamOf([sse]), {
          headers: { 'Content-Type': 'text/event-stream' },
        })
      }),
    )
    const received = await collect(
      streamPlanImport({ indicateurId: 'IND-1', tableau, nomFichier: 'taux.csv' }),
    )
    expect(received).toEqual(events)
    expect(bodies).toEqual([{ tableau, nomFichier: 'taux.csv' }])
  })

  it('lève quand le serveur refuse la demande avant le flux', async () => {
    server.use(
      http.post(apiUrl('/indicateurs/IND-1/valeurs:plan-import'), () =>
        HttpResponse.json({ code: 'FORBIDDEN', message: 'Interdit' }, { status: 403 }),
      ),
    )
    await expect(
      collect(streamPlanImport({ indicateurId: 'IND-1', tableau, nomFichier: 'taux.csv' })),
    ).rejects.toThrow()
  })
})
