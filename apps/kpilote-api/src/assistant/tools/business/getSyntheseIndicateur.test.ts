import { type SyntheseIndicateurOutput } from '@pilote/kpilote-shared/assistant/tools'
import { describe, expect, it, vi } from 'vitest'
import { type z } from 'zod'

import { createGetSyntheseIndicateurTool } from '@/assistant/tools/business/getSyntheseIndicateur'

const IDENTITE = JSON.stringify({
  id: 'IND-42',
  nom: 'Pauvreté',
  referentiels: [{ id: 'REF-DEPT' }, { id: 'REF-REG' }],
})

/** Un fetcher qui note les URL vues et sert l'identité de IND-42. */
const spyFetcher = () =>
  vi.fn((url: string) =>
    Promise.resolve(new Response(url === '/indicateurs/IND-42' ? IDENTITE : '{}')),
  )

const urlsSeenBy = (fetcher: ReturnType<typeof spyFetcher>): string[] =>
  fetcher.mock.calls.map(([url]) => url)

const runTool = (
  fetcher: ReturnType<typeof spyFetcher>,
  input: { id: string; individuId?: string },
): Promise<SyntheseIndicateurOutput> => {
  const tool = createGetSyntheseIndicateurTool(fetcher)
  return tool.execute?.(input, {
    toolCallId: 't',
    messages: [],
    context: undefined,
  }) as Promise<SyntheseIndicateurOutput>
}

describe('get_synthese_indicateur', () => {
  it("paramètre les valeurs remarquables avec les référentiels lus dans l'identité", async () => {
    const fetcher = spyFetcher()

    await runTool(fetcher, { id: 'IND-42' })

    expect(urlsSeenBy(fetcher)).toContain(
      '/indicateurs/IND-42/valeurs-remarquables?referentiels=REF-DEPT,REF-REG',
    )
  })

  it("n'appelle pas les routes qui exigent un territoire quand aucun n'est fourni", async () => {
    const fetcher = spyFetcher()

    const output = await runTool(fetcher, { id: 'IND-42' })

    expect(urlsSeenBy(fetcher)).toSatisfyAll((url: string) => !url.includes('taux-progression'))
    // Elles reviennent avec la marche à suivre, pas avec un 400 opaque.
    expect(output.tauxProgression).toContainEntry([
      'unavailable',
      expect.stringContaining('individuId'),
    ])
  })

  it("passe le territoire aux trois routes qui l'exigent", async () => {
    const fetcher = spyFetcher()

    await runTool(fetcher, { id: 'IND-42', individuId: 'DEPT-84' })

    expect(urlsSeenBy(fetcher)).toIncludeAllMembers([
      '/indicateurs/IND-42/taux-progression?individus=DEPT-84',
      '/indicateurs/IND-42/objectifs?individus=DEPT-84',
      '/indicateurs/IND-42/synthese-individus?individus=DEPT-84',
    ])
  })

  it("rapporte l'absence de référentiel plutôt que d'appeler les valeurs remarquables à vide", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ id: 'IND-42', nom: 'X', referentiels: [] }))),
    )

    const output = await runTool(fetcher, { id: 'IND-42' })

    expect(urlsSeenBy(fetcher)).toSatisfyAll((url: string) => !url.includes('valeurs-remarquables'))
    expect(output.valeursRemarquables).toContainEntry([
      'unavailable',
      expect.stringContaining('référentiel'),
    ])
  })

  it('rejette un identifiant mal formé avant tout appel', () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response('{}')))
    const tool = createGetSyntheseIndicateurTool(fetcher)

    const schema = tool.inputSchema as z.ZodType
    expect(schema.safeParse({ id: 'IND-quarante-deux' }).success).toBeFalse()
    expect(schema.safeParse({ id: 'IND-42' }).success).toBeTrue()
    expect(schema.safeParse({ id: 'IND-42', individuId: 'DEPT-84' }).success).toBeTrue()
    expect(fetcher).not.toHaveBeenCalled()
  })
})
