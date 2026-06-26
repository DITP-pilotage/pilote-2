import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'
import { Cloud, CloudLightning, CloudSun, Sun, type LucideIcon } from 'lucide-react'

export type Meteo = { indice: IndiceConfiance; label: string; Icon: LucideIcon }

const ORAGE: Meteo = { indice: 'OBJECTIF_COMPROMIS', label: 'Orage', Icon: CloudLightning }

export const METEOS: readonly Meteo[] = [
  ORAGE,
  { indice: 'APPUIS_NECESSAIRE', label: 'Couvert', Icon: Cloud },
  { indice: 'OBJECTIF_ATTEIGNABLE', label: 'Nuage', Icon: CloudSun },
  { indice: 'OBJECTIF_SECURISE', label: 'Soleil', Icon: Sun },
]

export const meteoFromIndice = (indice: IndiceConfiance): Meteo =>
  METEOS.find((meteo) => meteo.indice === indice)!
