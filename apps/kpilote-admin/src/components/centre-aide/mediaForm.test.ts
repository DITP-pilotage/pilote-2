import { buildMediaFormSchema, resolveMediaUrl, type MediaFormValues } from './mediaForm'

const ITEM_ID = '0f9e8d7c-6b5a-4c3d-8e2f-1a0b9c8d7e6f'
const PAGE_URL = `https://fichiers.numerique.gouv.fr/explorer/items/files/${ITEM_ID}`
const FINANCES_URL = 'https://video.finances.gouv.fr/lecteur_video/x'

const listInvalidFields = (values: Partial<MediaFormValues>): PropertyKey[] => {
  const result = buildMediaFormSchema('video').safeParse({
    url: '',
    fileName: '',
    extension: 'mp4',
    ...values,
  })
  return result.success ? [] : result.error.issues.flatMap((issue) => issue.path)
}

describe('buildMediaFormSchema', () => {
  it('accepte une adresse de média directe', () => {
    expect(listInvalidFields({ url: FINANCES_URL })).toEqual([])
  })

  it('refuse un hébergeur non autorisé', () => {
    expect(listInvalidFields({ url: 'https://example.org/x' })).toEqual(['url'])
  })

  it('demande le nom du fichier pour une adresse d’explorateur', () => {
    expect(listInvalidFields({ url: PAGE_URL })).toEqual(['fileName'])
    expect(listInvalidFields({ url: PAGE_URL, fileName: 'demo' })).toEqual([])
  })

  it('refuse une adresse d’explorateur sans identifiant de fichier', () => {
    expect(listInvalidFields({ url: 'https://fichiers.numerique.gouv.fr/explorer' })).toEqual([
      'url',
    ])
  })
})

describe('resolveMediaUrl', () => {
  it('garde une adresse directe', () => {
    expect(resolveMediaUrl({ url: FINANCES_URL, fileName: '', extension: 'mp4' })).toBe(
      FINANCES_URL,
    )
  })

  it('reconstruit l’adresse du média depuis l’explorateur', () => {
    expect(resolveMediaUrl({ url: PAGE_URL, fileName: 'demo', extension: 'webm' })).toBe(
      `https://fichiers.numerique.gouv.fr/media/preview/item/${ITEM_ID}/demo.webm`,
    )
  })
})
