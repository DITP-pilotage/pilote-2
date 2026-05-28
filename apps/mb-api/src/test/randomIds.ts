// Codes INSEE de régions françaises (https://www.insee.fr/fr/information/2114819)
const REG_CODES = [
  '01',
  '02',
  '03',
  '04',
  '06', // DROM (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte)
  '11', // Île-de-France
  '24', // Centre-Val de Loire
  '27', // Bourgogne-Franche-Comté
  '28', // Normandie
  '32', // Hauts-de-France
  '44', // Grand Est
  '52', // Pays de la Loire
  '53', // Bretagne
  '75', // Nouvelle-Aquitaine
  '76', // Occitanie
  '84', // Auvergne-Rhône-Alpes
  '93', // Provence-Alpes-Côte d'Azur
  '94', // Corse
] as const

// Codes INSEE de départements français (métropolitains 01-95 + 2A/2B + DOM 971-976)
const DEPT_CODES = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '2A',
  '2B',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
  '49',
  '50',
  '51',
  '52',
  '53',
  '54',
  '55',
  '56',
  '57',
  '58',
  '59',
  '60',
  '61',
  '62',
  '63',
  '64',
  '65',
  '66',
  '67',
  '68',
  '69',
  '70',
  '71',
  '72',
  '73',
  '74',
  '75',
  '76',
  '77',
  '78',
  '79',
  '80',
  '81',
  '82',
  '83',
  '84',
  '85',
  '86',
  '87',
  '88',
  '89',
  '90',
  '91',
  '92',
  '93',
  '94',
  '95',
  '971',
  '972',
  '973',
  '974',
  '976',
] as const

const pickRandom = <T>(items: ReadonlyArray<T>): T =>
  items[Math.floor(Math.random() * items.length)]!

type FixedTuple<N extends number, T, Acc extends T[] = []> = Acc['length'] extends N
  ? Acc
  : FixedTuple<N, T, [T, ...Acc]>

const uniqueIds = <N extends number>(factory: () => string, count: N): FixedTuple<N, string> => {
  const ids = new Set<string>()
  while (ids.size < count) ids.add(factory())
  return [...ids].sort() as FixedTuple<N, string>
}

// 12 caractères alphanum ⇒ ~10^21 combinaisons : collisions négligeables même
// entre tests parallèles d'un même run (limite la contention de row-locks).
const ALPHANUM = 'abcdefghijklmnopqrstuvwxyz0123456789'
const randomToken = (length: number): string => {
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)]
  return out
}

export const testIndicateurId = (): string => `IND-${randomToken(12)}`

export const testReferentielId = (): string => `REF-${randomToken(12)}`

export const testIndividuId = (): string => `TEST-${randomToken(12)}`

export const testWidgetId = (): string => `WID-${randomToken(12).toUpperCase()}`

export const testDeptId = (): string => `DEPT-${pickRandom(DEPT_CODES)}`

export const testRegId = (): string => `REG-${pickRandom(REG_CODES)}`

export const testEmail = (): string => `utilisateur-${randomToken(12)}@example.com`

// `pilote_live_<token>` — préfixe imposé par looksLikeApiKey, longueur ≥ 20 pour
// que le slice(0, 20) côté apiKey produise un préfixe stable.
export const testApiKeyRawKey = (): string => `pilote_live_${randomToken(32)}`

export const testIndicateurIds = <N extends number>(n: N): FixedTuple<N, string> =>
  uniqueIds(testIndicateurId, n)

export const testReferentielIds = <N extends number>(n: N): FixedTuple<N, string> =>
  uniqueIds(testReferentielId, n)

export const testDeptIds = <N extends number>(n: N): FixedTuple<N, string> =>
  uniqueIds(testDeptId, n)

export const testRegIds = <N extends number>(n: N): FixedTuple<N, string> => uniqueIds(testRegId, n)
