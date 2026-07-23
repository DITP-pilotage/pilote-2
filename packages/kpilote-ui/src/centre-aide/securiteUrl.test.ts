import { estUrlHttpSure } from './securiteUrl'

it('accepte http et https absolus', () => {
  expect(estUrlHttpSure('https://video.finances.gouv.fr/embed/x')).toBe(true)
  expect(estUrlHttpSure('http://example.org/embed')).toBe(true)
})

it('rejette les schémas dangereux et les URLs invalides', () => {
  expect(estUrlHttpSure('javascript:alert(1)')).toBe(false)
  expect(estUrlHttpSure('data:text/html,<script>alert(1)</script>')).toBe(false)
  expect(estUrlHttpSure('/relative/path')).toBe(false)
  expect(estUrlHttpSure('')).toBe(false)
})
