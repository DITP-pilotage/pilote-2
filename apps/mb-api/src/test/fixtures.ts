import { uuidv7 } from 'uuidv7'

import { db } from '@/framework/persistence/dbStore'
import { type IndicateurModel } from '@/generated/prisma/models'

type IndicateurOverrides = Partial<{ id: string; publicId: string; nom: string }>

const DEFAULT_INDICATEUR = { publicId: 'IND-1', nom: 'Indicateur de test' } as const

function indicateur(): Promise<IndicateurModel>
function indicateur(override: IndicateurOverrides): Promise<IndicateurModel>
function indicateur(
  o1: IndicateurOverrides,
  o2: IndicateurOverrides,
  ...rest: IndicateurOverrides[]
): Promise<IndicateurModel[]>
async function indicateur(
  ...overrides: IndicateurOverrides[]
): Promise<IndicateurModel | IndicateurModel[]> {
  const upsert = (o: IndicateurOverrides = {}) => {
    const data = { id: uuidv7(), ...DEFAULT_INDICATEUR, ...o }
    return db().indicateur.upsert({
      where: { publicId: data.publicId },
      update: { nom: data.nom },
      create: data,
    })
  }

  if (overrides.length <= 1) return upsert(overrides[0])
  return Promise.all(overrides.map(upsert))
}

export const fixtures = { indicateur }
