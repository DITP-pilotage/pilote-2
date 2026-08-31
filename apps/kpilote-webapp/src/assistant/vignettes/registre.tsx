import type { TypeVignette, Vignette } from '@pilote/kpilote-shared/assistant/vignettes'
import { Heading, Text } from '@pilote/kpilote-ui/Typography'
import type { ReactNode } from 'react'

import { CollectionAvancement } from '@/components/collections/CollectionAvancement'
import { CollectionTauxProgression } from '@/components/collections/CollectionTauxProgression'
import { IndicateurValeursTable } from '@/components/indicateurs/IndicateurValeursTable'

import {
  AdaptateurAvancementIndicateur,
  AdaptateurCarteIndicateur,
  AdaptateurCourbeIndicateur,
} from './adaptateurs'

type Rendu<T extends TypeVignette> = (vignette: Extract<Vignette, { type: T }>) => ReactNode

// Le mapped type sur l'union impose une entrée par vignette : ajouter un cas au catalogue
// partagé casse la compilation ici tant que son composant n'existe pas. C'est ce que le
// `Record<string, …>` de `WidgetRenderer` ne garantit pas.
export const REGISTRE_VIGNETTES: { [T in TypeVignette]: Rendu<T> } = {
  vignette_avancement_indicateur: (vignette) => (
    <AdaptateurAvancementIndicateur
      indicateurId={vignette.indicateurId}
      individuId={vignette.individuId}
    />
  ),
  vignette_courbe_indicateur: (vignette) => (
    <AdaptateurCourbeIndicateur
      indicateurId={vignette.indicateurId}
      individuId={vignette.individuId}
    />
  ),
  vignette_tableau_valeurs_indicateur: (vignette) => (
    <IndicateurValeursTable indicateurId={vignette.indicateurId} individuId={vignette.individuId} />
  ),
  vignette_carte_indicateur: (vignette) => (
    <AdaptateurCarteIndicateur
      indicateurId={vignette.indicateurId}
      referentielId={vignette.referentielId}
    />
  ),
  vignette_avancement_collection: (vignette) => (
    <CollectionAvancement collectionId={vignette.collectionId} individuId={vignette.individuId} />
  ),
  vignette_taux_collection: (vignette) => (
    <CollectionTauxProgression
      collectionId={vignette.collectionId}
      individu={vignette.individuId}
    />
  ),
  vignette_titre_section: (vignette) => <Heading as="h3">{vignette.texte}</Heading>,
  vignette_paragraphe: (vignette) => <Text>{vignette.texte}</Text>,
}
