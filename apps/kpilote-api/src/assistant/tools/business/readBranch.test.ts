import { describe, expect, it, vi } from 'vitest'

import { readBranch, WITHOUT_TERRITOIRE } from '@/assistant/tools/business/readBranch'

describe('readBranch', () => {
  it('rend les données de la route sous la clé data', async () => {
    const fetcher = vi.fn((url: string) => Promise.resolve(new Response(JSON.stringify({ url }))))

    await expect(readBranch(fetcher, '/un')).resolves.toEqual({ data: { url: '/un' } })
  })

  it("porte la raison d'indisponibilité plutôt qu'un null nu", async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response('non', { status: 403 })))

    await expect(readBranch(fetcher, '/un')).resolves.toEqual({
      unavailable: expect.stringContaining('403'),
    })
  })

  it("distingue un refus de droit d'une absence de données", async () => {
    const fetcher = vi.fn((url: string) =>
      Promise.resolve(
        url === '/interdit' ? new Response('', { status: 403 }) : new Response('{"items":[]}'),
      ),
    )

    await expect(readBranch(fetcher, '/ok')).resolves.toEqual({ data: { items: [] } })
    // Un 403 ne se lit pas comme « pas de données » : la branche dit pourquoi.
    await expect(readBranch(fetcher, '/interdit')).resolves.toContainKey('unavailable')
  })
})

describe('WITHOUT_TERRITOIRE', () => {
  it('nomme le paramètre à fournir pour que le modèle sache quoi rappeler', () => {
    expect(WITHOUT_TERRITOIRE).toContainEntry([
      'unavailable',
      expect.stringContaining('individuId'),
    ])
  })
})
