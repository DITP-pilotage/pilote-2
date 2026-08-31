import { z } from 'zod'

import {
  collectionPublicIdSchema,
  indicateurPublicIdSchema,
  individuPublicIdSchema,
  referentielPublicIdSchema,
} from '../publicIds'

// Grille à six colonnes. `largeur` est le SEUL enum du catalogue, et il ne décrit qu'un
// périmètre d'affichage : un enum qui changerait la nature de ce qui est montré ferait
// confondre les vignettes au modèle, c'est le constat de ppg sur leur `kpi_card` paramétré.
export const LARGEURS = ['tiers', 'moitie', 'pleine'] as const
export type Largeur = (typeof LARGEURS)[number]

export const COLONNES_PAR_LARGEUR: Record<Largeur, number> = {
  tiers: 2,
  moitie: 3,
  pleine: 6,
}

const largeurSchema = z
  .enum(LARGEURS)
  .describe('Largeur occupée dans la grille : tiers, moitie ou pleine.')

// Toutes les données d'indicateur de kpilote sont indexées par individu : une vignette
// porte donc l'entité ET le territoire. C'est ce que le contexte `focus` + `cadrage` du
// contrat de surface fournit.
const refIndicateur = {
  indicateurId: indicateurPublicIdSchema,
  individuId: individuPublicIdSchema.describe('Territoire pour lequel la donnée est lue.'),
}

const refCollection = {
  collectionId: collectionPublicIdSchema,
  individuId: individuPublicIdSchema.describe('Territoire pour lequel la donnée est lue.'),
}

export const vignetteSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('vignette_avancement_indicateur'),
    ...refIndicateur,
    largeur: largeurSchema.default('tiers'),
  }),
  z.object({
    type: z.literal('vignette_courbe_indicateur'),
    ...refIndicateur,
    largeur: largeurSchema.default('moitie'),
  }),
  z.object({
    type: z.literal('vignette_tableau_valeurs_indicateur'),
    ...refIndicateur,
    largeur: largeurSchema.default('moitie'),
  }),
  z.object({
    type: z.literal('vignette_carte_indicateur'),
    indicateurId: indicateurPublicIdSchema,
    referentielId: referentielPublicIdSchema.describe(
      'Référentiel dont les individus sont cartographiés. Détermine la maille de la carte.',
    ),
    largeur: largeurSchema.default('moitie'),
  }),
  z.object({
    type: z.literal('vignette_avancement_collection'),
    ...refCollection,
    largeur: largeurSchema.default('tiers'),
  }),
  z.object({
    type: z.literal('vignette_taux_collection'),
    ...refCollection,
    largeur: largeurSchema.default('tiers'),
  }),
  z.object({
    type: z.literal('vignette_titre_section'),
    texte: z.string().min(1).max(80).describe('Titre court introduisant une section de la vue.'),
    largeur: largeurSchema.default('pleine'),
  }),
  z.object({
    type: z.literal('vignette_paragraphe'),
    // La SEULE vignette où le modèle écrit du contenu. Aucune valeur chiffrée : les chiffres
    // appartiennent aux autres vignettes, qui les lisent à la source.
    texte: z
      .string()
      .min(1)
      .max(400)
      .describe(
        'Texte de mise en contexte. Ne contient JAMAIS de valeur chiffrée ni de pourcentage.',
      ),
    largeur: largeurSchema.default('pleine'),
  }),
])

export type Vignette = z.infer<typeof vignetteSchema>
export type TypeVignette = Vignette['type']

export const TYPES_VIGNETTE = vignetteSchema.options.map(
  (option) => option.shape.type.value,
) as ReadonlyArray<TypeVignette>

export const MAX_VIGNETTES = 12

export const vueSchema = z.object({
  titre: z.string().min(1).max(80).describe('Titre de la vue.'),
  vignettes: z.array(vignetteSchema).min(1).max(MAX_VIGNETTES),
})

export type Vue = z.infer<typeof vueSchema>
