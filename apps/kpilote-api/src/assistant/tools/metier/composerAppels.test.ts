import { describe, expect, it, vi } from 'vitest'
import { type z } from 'zod'

import { composerAppels } from '@/assistant/tools/metier/composerAppels'
import { creerGetSyntheseIndicateurTool } from '@/assistant/tools/metier/getSyntheseIndicateur'

describe('composerAppels', () => {
  it('assemble les réponses sous les clés demandées', async () => {
    const requeteur = vi.fn((url: string) => Promise.resolve(new Response(JSON.stringify({ url }))))
    const resultat = await composerAppels(requeteur, { a: '/un', b: '/deux' })

    expect(resultat).toEqual({
      a: { donnees: { url: '/un' } },
      b: { donnees: { url: '/deux' } },
    })
  })

  it('lance les appels en parallèle', async () => {
    const appels: string[] = []
    let libererPremier: () => void = () => undefined
    const requeteur = vi.fn((url: string) => {
      appels.push(url)
      // Le premier appel reste en attente : si la composition était séquentielle, le
      // second ne partirait jamais.
      if (url === '/un') {
        return new Promise<Response>((resolve) => {
          libererPremier = () => resolve(new Response('{}'))
        })
      }
      return Promise.resolve(new Response('{}'))
    })

    const promesse = composerAppels(requeteur, { a: '/un', b: '/deux' })
    await Promise.resolve()
    expect(appels).toEqual(['/un', '/deux'])

    libererPremier()
    await promesse
  })

  it('porte la raison d’indisponibilité plutôt qu’un null nu', async () => {
    const requeteur = vi.fn(() => Promise.resolve(new Response('non', { status: 403 })))
    const resultat = await composerAppels(requeteur, { a: '/un' })

    expect(resultat.a).toEqual({ indisponible: expect.stringContaining('403') })
  })

  it('distingue un refus de droit d’une absence de données', async () => {
    const requeteur = vi.fn((url: string) =>
      Promise.resolve(
        url === '/interdit' ? new Response('', { status: 403 }) : new Response('{"items":[]}'),
      ),
    )
    const resultat = await composerAppels(requeteur, { vide: '/ok', refuse: '/interdit' })

    expect(resultat.vide).toEqual({ donnees: { items: [] } })
    expect('indisponible' in (resultat.refuse as object)).toBe(true)
  })
})

describe('get_synthese_indicateur', () => {
  const identite = JSON.stringify({
    id: 'IND-42',
    nom: 'Pauvreté',
    referentiels: [{ id: 'REF-DEPT' }, { id: 'REF-REG' }],
  })

  const requeteurEspion = () => {
    const vues: string[] = []
    const requeteur = vi.fn((url: string) => {
      vues.push(url)
      return Promise.resolve(new Response(url === '/indicateurs/IND-42' ? identite : '{}'))
    })
    return { vues, requeteur }
  }

  it('paramètre les valeurs remarquables avec les référentiels lus dans l’identité', async () => {
    const { vues, requeteur } = requeteurEspion()

    const outil = creerGetSyntheseIndicateurTool(requeteur)
    await outil.execute?.({ id: 'IND-42' }, { toolCallId: 't', messages: [] })

    expect(vues).toContain('/indicateurs/IND-42/valeurs-remarquables?referentiels=REF-DEPT,REF-REG')
  })

  it('n’appelle pas les routes qui exigent un territoire quand aucun n’est fourni', async () => {
    const { vues, requeteur } = requeteurEspion()

    const outil = creerGetSyntheseIndicateurTool(requeteur)
    const sortie = (await outil.execute?.({ id: 'IND-42' }, { toolCallId: 't', messages: [] })) as {
      tauxProgression: { indisponible?: string }
    }

    expect(vues.some((url) => url.includes('taux-progression'))).toBe(false)
    // Elles reviennent avec la marche à suivre, pas avec un 400 opaque.
    expect(sortie.tauxProgression.indisponible).toContain('individuId')
  })

  it('passe le territoire aux trois routes qui l’exigent', async () => {
    const { vues, requeteur } = requeteurEspion()

    const outil = creerGetSyntheseIndicateurTool(requeteur)
    await outil.execute?.(
      { id: 'IND-42', individuId: 'DEPT-84' },
      { toolCallId: 't', messages: [] },
    )

    expect(vues).toContain('/indicateurs/IND-42/taux-progression?individus=DEPT-84')
    expect(vues).toContain('/indicateurs/IND-42/objectifs?individus=DEPT-84')
    expect(vues).toContain('/indicateurs/IND-42/synthese-individus?individus=DEPT-84')
  })

  it('rejette un identifiant mal formé avant tout appel', () => {
    const requeteur = vi.fn(() => Promise.resolve(new Response('{}')))
    const outil = creerGetSyntheseIndicateurTool(requeteur)

    const schema = outil.inputSchema as z.ZodType
    expect(schema.safeParse({ id: 'IND-quarante-deux' }).success).toBe(false)
    expect(schema.safeParse({ id: 'IND-42' }).success).toBe(true)
    expect(schema.safeParse({ id: 'IND-42', individuId: 'DEPT-84' }).success).toBe(true)
    expect(requeteur).not.toHaveBeenCalled()
  })
})
