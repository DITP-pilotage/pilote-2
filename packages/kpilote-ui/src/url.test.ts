import { estUrlHttpSure, sansAutoplay } from '@pilote/kpilote-shared/url'

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

it('retire les paramètres d’autoplay', () => {
  expect(sansAutoplay('https://x/embed?autoplay=1&start=5')).toBe('https://x/embed?start=5')
  expect(sansAutoplay('https://x/embed')).toBe('https://x/embed')
  expect(sansAutoplay('pas-une-url')).toBe('pas-une-url')
})
