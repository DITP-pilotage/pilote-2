import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'
import { Cloud, CloudLightning, CloudSun, Sun, type LucideIcon } from 'lucide-react'

export type Meteo = { indice: IndiceConfiance; label: string; Icon: LucideIcon }

// Record exhaustif : ajouter un IndiceConfiance fait échouer la compilation.
const METEO_PAR_INDICE: Record<IndiceConfiance, Omit<Meteo, 'indice'>> = {
  OBJECTIF_COMPROMIS: { label: 'Orage', Icon: CloudLightning },
  APPUIS_NECESSAIRE: { label: 'Couvert', Icon: Cloud },
  OBJECTIF_ATTEIGNABLE: { label: 'Nuage', Icon: CloudSun },
  OBJECTIF_SECURISE: { label: 'Soleil', Icon: Sun },
}

// Ordre d'affichage du sélecteur, du plus dégradé au plus serein.
const ORDRE_SELECTEUR: readonly IndiceConfiance[] = [
  'OBJECTIF_COMPROMIS',
  'APPUIS_NECESSAIRE',
  'OBJECTIF_ATTEIGNABLE',
  'OBJECTIF_SECURISE',
]

export const METEOS: readonly Meteo[] = ORDRE_SELECTEUR.map((indice) => ({
  indice,
  ...METEO_PAR_INDICE[indice],
}))

export const meteoFromIndice = (indice: IndiceConfiance): Meteo => ({
  indice,
  ...METEO_PAR_INDICE[indice],
})
