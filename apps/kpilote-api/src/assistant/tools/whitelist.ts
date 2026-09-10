import { type WhitelistEntry } from '@/assistant/tools/deriveTool'
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
// offrirait au modèle un chemin plus verbeux vers le même résultat.
//
// Volontairement hors périmètre : apiKey, feature, permission, utilisateur, me, whoami,
// brouillons de commentaire — administration, pas analyse.
export const WHITELIST: ReadonlyArray<WhitelistEntry> = [
  { name: 'get_indicateurs', route: getIndicateursRoute },
  { name: 'get_indicateur', route: getIndicateurByIdRoute },
  { name: 'get_indicateur_valeurs', route: getValeursForIndicateurRoute },
  { name: 'get_collections', route: getCollectionsRoute },
  { name: 'get_collection', route: getCollectionByIdRoute },
  { name: 'get_individu_dernieres_valeurs', route: getDernieresValeursForIndividuRoute },
  { name: 'get_referentiels', route: getReferentielsRoute },
  { name: 'get_referentiel_individus', route: getIndividusForReferentielRoute },
]
