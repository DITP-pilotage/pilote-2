import { HTTPError } from 'ky'

import { extractApiError } from './apiError'

const httpError = (status: number, data: unknown): HTTPError => {
  const error = new HTTPError(
    new Response(null, { status }),
    new Request('http://localhost/api/indicateurs/IND-001', { method: 'PUT' }),
    {} as ConstructorParameters<typeof HTTPError>[2],
  )
  error.data = data
  return error
}

it('restitue le message de l’API (409 de structure, relation refusée…)', () => {
  expect(
    extractApiError(
      httpError(409, {
        code: 'FAITS_MASQUES',
        message: 'Refusé : le parent porte des faits sur un indicateur multi-dimension',
      }),
    ),
  ).toBe('Refusé : le parent porte des faits sur un indicateur multi-dimension')
})

it('ajoute les dimensions à configurer au message', () => {
  expect(
    extractApiError(
      httpError(400, {
        code: 'VALIDATION_ERROR',
        message: 'Indicateur multi-dimension : configurer chaque nouvelle dimension',
        details: { dimensionsAConfigurer: ['DIM-OPERATEUR'] },
      }),
    ),
  ).toBe('Indicateur multi-dimension : configurer chaque nouvelle dimension : DIM-OPERATEUR')
})

it('ajoute les dimensions inconnues au message', () => {
  expect(
    extractApiError(
      httpError(400, {
        code: 'VALIDATION_ERROR',
        message: 'Dimension inconnue',
        details: { unknownDimensionIds: ['DIM-X'] },
      }),
    ),
  ).toBe('Dimension inconnue : DIM-X')
})
