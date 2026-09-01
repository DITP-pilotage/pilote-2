import { type EntreeWhitelist } from '@/assistant/tools/deriverTool'
import { getCollectionByIdRoute, getCollectionsRoute } from '@/collection/routes'
import { getIndicateurByIdRoute, getIndicateursRoute } from '@/indicateur/routes'
import { getIndividusForReferentielRoute, getReferentielsRoute } from '@/referentiel/routes'
import {
  getDernieresValeursForIndividuRoute,
  getValeursForIndicateurRoute,
} from '@/valeurAvancement/routes'

// Le nom de l'outil est déclaré ici plutôt que dérivé du chemin : une dérivation
// automatique buterait sur la singularisation pour un gain nul.
//
// Volontairement absentes : les routes que `get_synthese_indicateur` compose déjà
// (taux-progression, valeurs-remarquables, objectifs, synthese-individus). Les exposer
// offrirait au modèle un chemin plus verbeux vers le même résultat. Le jeu d'évals dira
// s'il en manque une.
//
// Volontairement hors périmètre : apiKey, feature, permission, utilisateur, me, whoami,
// brouillons de commentaire — administration, pas analyse.
export const WHITELIST: ReadonlyArray<EntreeWhitelist> = [
  { nom: 'get_indicateurs', route: getIndicateursRoute },
  { nom: 'get_indicateur', route: getIndicateurByIdRoute },
  { nom: 'get_indicateur_valeurs', route: getValeursForIndicateurRoute },
  { nom: 'get_collections', route: getCollectionsRoute },
  { nom: 'get_collection', route: getCollectionByIdRoute },
  { nom: 'get_individu_dernieres_valeurs', route: getDernieresValeursForIndividuRoute },
  { nom: 'get_referentiels', route: getReferentielsRoute },
  { nom: 'get_referentiel_individus', route: getIndividusForReferentielRoute },
]
