// Import the route first so @hono/zod-openapi extends the Zod prototype
// before mb-shared schemas are evaluated.
import {
  ErrorApiModelSchema,
  getIndicateurById,
  INDICATEUR_NOT_FOUND_CODE,
} from '@/indicateur/routes/getIndicateurById'
import { indicateurApiModelSchema } from '@pilote/mb-shared'
import { describe, expect, it } from 'vitest'

describe('GET /indicateurs/:id', () => {
  it('retourne un indicateur par id', async () => {
    const response = await getIndicateurById.request('/indicateurs/1')
    const body = indicateurApiModelSchema.parse(await response.json())

    expect(response.status).toBe(200)
    expect(body.id).toBe(1)
    expect(body.nom).toBe('Taux de chômage')
  })

  it('retourne 404 avec un code stable si l\'indicateur n\'existe pas', async () => {
    const response = await getIndicateurById.request('/indicateurs/9999')
    const body = ErrorApiModelSchema.parse(await response.json())

    expect(response.status).toBe(404)
    expect(body.code).toBe(INDICATEUR_NOT_FOUND_CODE)
    expect(body.message).toBe('Indicateur introuvable')
  })

  it('retourne 400 si l\'id n\'est pas un nombre', async () => {
    const response = await getIndicateurById.request('/indicateurs/abc')

    expect(response.status).toBe(400)
  })
})
