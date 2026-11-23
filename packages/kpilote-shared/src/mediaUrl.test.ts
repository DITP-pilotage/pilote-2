import { describe, expect, it } from 'vitest'

import {
  buildFichiersMediaUrl,
  extractFichiersItemId,
  isAllowedMediaUrl,
  isFichiersMediaUrl,
} from './mediaUrl'

const ITEM_ID = '0f9e8d7c-6b5a-4c3d-8e2f-1a0b9c8d7e6f'
const PAGE_URL = `https://fichiers.numerique.gouv.fr/explorer/items/files/${ITEM_ID}`
const MEDIA_URL = `https://fichiers.numerique.gouv.fr/media/preview/item/${ITEM_ID}/demo.mp4`
const FINANCES_URL = 'https://video.finances.gouv.fr/lecteur_video/x'

describe('isAllowedMediaUrl', () => {
  it('accepte les hébergeurs prévus pour chaque type de média', () => {
    expect(isAllowedMediaUrl({ kind: 'video', url: FINANCES_URL })).toBe(true)
    expect(isAllowedMediaUrl({ kind: 'video', url: MEDIA_URL })).toBe(true)
    expect(isAllowedMediaUrl({ kind: 'image', url: MEDIA_URL })).toBe(true)
    expect(isAllowedMediaUrl({ kind: 'image', url: FINANCES_URL })).toBe(false)
  })

  it('refuse un autre hôte, un hôte ressemblant, http et une adresse invalide', () => {
    expect(isAllowedMediaUrl({ kind: 'video', url: 'https://example.org/x' })).toBe(false)
    expect(
      isAllowedMediaUrl({ kind: 'video', url: 'https://video.finances.gouv.fr.example.org/x' }),
    ).toBe(false)
    expect(isAllowedMediaUrl({ kind: 'video', url: 'http://video.finances.gouv.fr/x' })).toBe(false)
    expect(isAllowedMediaUrl({ kind: 'video', url: 'javascript:alert(1)' })).toBe(false)
    expect(isAllowedMediaUrl({ kind: 'video', url: '' })).toBe(false)
  })
})

describe('adresses fichiers.numerique', () => {
  it('distingue le média de la page du fichier', () => {
    expect(isFichiersMediaUrl(MEDIA_URL)).toBe(true)
    expect(isFichiersMediaUrl(PAGE_URL)).toBe(false)
    expect(isFichiersMediaUrl(FINANCES_URL)).toBe(false)
  })

  it('retrouve l’identifiant du fichier', () => {
    expect(extractFichiersItemId(PAGE_URL)).toBe(ITEM_ID)
    expect(extractFichiersItemId('https://fichiers.numerique.gouv.fr/explorer')).toBeNull()
    expect(extractFichiersItemId(`https://example.org/${ITEM_ID}`)).toBeNull()
  })

  it('construit l’adresse du média en encodant le nom', () => {
    expect(buildFichiersMediaUrl({ itemId: ITEM_ID, fileName: 'ma démo', extension: 'mp4' })).toBe(
      `https://fichiers.numerique.gouv.fr/media/preview/item/${ITEM_ID}/ma%20d%C3%A9mo.mp4`,
    )
  })
})
