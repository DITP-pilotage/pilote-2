import type { Tile, TileType } from '@pilote/kpilote-shared/assistant/tiles'
import { Heading, Text } from '@pilote/kpilote-ui/Typography'
import type { ReactNode } from 'react'

import { CollectionAvancement } from '@/components/collections/CollectionAvancement'
import { CollectionTauxProgression } from '@/components/collections/CollectionTauxProgression'
import { IndicateurValeursTable } from '@/components/indicateurs/IndicateurValeursTable'

import { AvancementIndicateurAdapter } from './adapters/AvancementIndicateurAdapter'
import { CarteIndicateurAdapter } from './adapters/CarteIndicateurAdapter'
import { CourbeIndicateurAdapter } from './adapters/CourbeIndicateurAdapter'

type Render<T extends TileType> = (tile: Extract<Tile, { type: T }>) => ReactNode

// Le mapped type sur l'union impose une entrée par tuile : ajouter un cas au catalogue
// partagé casse la compilation ici tant que son composant n'existe pas. C'est ce que le
// `Record<string, …>` de `WidgetRenderer` ne garantit pas.
export const TILE_REGISTRY: { [T in TileType]: Render<T> } = {
  tile_avancement_indicateur: (tile) => (
    <AvancementIndicateurAdapter indicateurId={tile.indicateurId} individuId={tile.individuId} />
  ),
  tile_courbe_indicateur: (tile) => (
    <CourbeIndicateurAdapter indicateurId={tile.indicateurId} individuId={tile.individuId} />
  ),
  tile_tableau_valeurs_indicateur: (tile) => (
    <IndicateurValeursTable indicateurId={tile.indicateurId} individuId={tile.individuId} />
  ),
  tile_carte_indicateur: (tile) => (
    <CarteIndicateurAdapter indicateurId={tile.indicateurId} referentielId={tile.referentielId} />
  ),
  tile_avancement_collection: (tile) => (
    <CollectionAvancement collectionId={tile.collectionId} individuId={tile.individuId} />
  ),
  tile_taux_collection: (tile) => (
    <CollectionTauxProgression collectionId={tile.collectionId} individu={tile.individuId} />
  ),
  tile_titre_section: (tile) => <Heading as="h3">{tile.text}</Heading>,
  tile_paragraphe: (tile) => <Text>{tile.text}</Text>,
}
