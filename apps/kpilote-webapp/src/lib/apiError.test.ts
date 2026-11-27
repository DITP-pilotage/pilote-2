import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { pinIndicateur } from '@/api/indicateurs'
import { apiErrorOf } from '@/lib/apiError'
import { apiUrl, server } from '@/tests/server'

const errorOfPin = async (): Promise<unknown> =>
  pinIndicateur('IND-1').then(
    () => undefined,
    (error: unknown) => error,
  )

describe('apiErrorOf', () => {
  it('lit le code et le message d’une erreur métier de l’API', async () => {
    server.use(
      http.put(apiUrl('/indicateurs/IND-1/epingle'), () =>
        HttpResponse.json(
          {
            code: 'LIMITE_EPINGLES_ATTEINTE',
            message: 'Vous avez déjà épinglé 20 indicateurs.',
            details: { limite: 20 },
          },
          { status: 409 },
        ),
      ),
    )

    expect(apiErrorOf(await errorOfPin())).toEqual({
      code: 'LIMITE_EPINGLES_ATTEINTE',
      message: 'Vous avez déjà épinglé 20 indicateurs.',
      details: { limite: 20 },
    })
  })

  it('renvoie undefined pour une réponse sans erreur métier', async () => {
    server.use(
      http.put(apiUrl('/indicateurs/IND-1/epingle'), () => new HttpResponse(null, { status: 502 })),
    )

    expect(apiErrorOf(await errorOfPin())).toBeUndefined()
  })

  it('renvoie undefined pour une erreur qui ne vient pas de l’API', () => {
    expect(apiErrorOf(new Error('réseau'))).toBeUndefined()
  })
})
