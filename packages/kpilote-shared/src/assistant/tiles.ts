import { z } from 'zod'

import {
  collectionPublicIdSchema,
  indicateurPublicIdSchema,
  individuPublicIdSchema,
  referentielPublicIdSchema,
} from '../publicIds'

// Grille à six colonnes. `width` est le SEUL enum du catalogue, et il ne décrit qu'un
// périmètre d'affichage : un enum qui changerait la nature de ce qui est montré ferait
// confondre les tuiles au modèle, c'est le constat de ppg sur leur `kpi_card` paramétré.
export const WIDTHS = ['third', 'half', 'full'] as const
export type Width = (typeof WIDTHS)[number]

export const COLUMNS_BY_WIDTH: Record<Width, number> = {
  third: 2,
  half: 3,
  full: 6,
}

const widthSchema = z.enum(WIDTHS).describe('Largeur occupée dans la grille : third, half ou full.')

// Toutes les données d'indicateur de kpilote sont indexées par individu : une tuile porte
// donc l'entité ET le territoire. C'est ce que le contexte `focus` + `scope` du contrat de
// surface fournit.
const indicateurRef = {
  indicateurId: indicateurPublicIdSchema,
  individuId: individuPublicIdSchema.describe('Territoire pour lequel la donnée est lue.'),
}

const collectionRef = {
  collectionId: collectionPublicIdSchema,
  individuId: individuPublicIdSchema.describe('Territoire pour lequel la donnée est lue.'),
}

export const tileSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('tile_avancement_indicateur'),
    ...indicateurRef,
    width: widthSchema.default('third'),
  }),
  z.object({
    type: z.literal('tile_courbe_indicateur'),
    ...indicateurRef,
    width: widthSchema.default('half'),
  }),
  z.object({
    type: z.literal('tile_tableau_valeurs_indicateur'),
    ...indicateurRef,
    width: widthSchema.default('half'),
  }),
  z.object({
    type: z.literal('tile_carte_indicateur'),
    indicateurId: indicateurPublicIdSchema,
    referentielId: referentielPublicIdSchema.describe(
      'Référentiel dont les individus sont cartographiés. Détermine la maille de la carte.',
    ),
    width: widthSchema.default('half'),
  }),
  z.object({
    type: z.literal('tile_avancement_collection'),
    ...collectionRef,
    width: widthSchema.default('third'),
  }),
  z.object({
    type: z.literal('tile_taux_collection'),
    ...collectionRef,
    width: widthSchema.default('third'),
  }),
  z.object({
    type: z.literal('tile_titre_section'),
    text: z.string().min(1).max(80).describe('Titre court introduisant une section de la vue.'),
    width: widthSchema.default('full'),
  }),
  z.object({
    type: z.literal('tile_paragraphe'),
    // La SEULE tuile où le modèle écrit du contenu. Aucune valeur chiffrée : les chiffres
    // appartiennent aux autres tuiles, qui les lisent à la source.
    text: z
      .string()
      .min(1)
      .max(400)
      .describe(
        'Texte de mise en contexte. Ne contient JAMAIS de valeur chiffrée ni de pourcentage.',
      ),
    width: widthSchema.default('full'),
  }),
])

export type Tile = z.infer<typeof tileSchema>
export type TileType = Tile['type']

export const TILE_TYPES = tileSchema.options.map(
  (option) => option.shape.type.value,
) as ReadonlyArray<TileType>

export const MAX_TILES = 12

export const viewSchema = z.object({
  title: z.string().min(1).max(80).describe('Titre de la vue.'),
  tiles: z.array(tileSchema).min(1).max(MAX_TILES),
})

export type View = z.infer<typeof viewSchema>
