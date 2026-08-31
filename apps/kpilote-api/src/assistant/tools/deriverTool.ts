import { type RouteConfig } from '@hono/zod-openapi'
import { type NomOutil } from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'
import { z } from 'zod'

import { type Requeteur } from '@/assistant/tools/requeteur'

export type EntreeWhitelist = { nom: NomOutil; route: RouteConfig }

const PARAM_DANS_CHEMIN = /\{([^}]+)\}/g

/**
 * Un paramètre d'URL ne peut être qu'un scalaire. Tout le reste renvoie `null` et est
 * ignoré : `String({})` produirait `[object Object]` dans l'URL, ce qu'aucune route
 * n'attend et que personne ne diagnostiquerait facilement.
 */
const enChaine = (valeur: unknown): string | null => {
  if (typeof valeur === 'string') return valeur
  if (typeof valeur === 'number' || typeof valeur === 'boolean') return String(valeur)
  return null
}

/**
 * Reconstitue l'URL documentée par la route : les paramètres qui apparaissent entre
 * accolades dans le chemin y sont substitués, les autres partent en query string.
 */
export const construireUrl = (chemin: string, params: Record<string, unknown>): string => {
  const consommes = new Set<string>()
  const chemAvecParams = chemin.replace(PARAM_DANS_CHEMIN, (_correspondance, nom: string) => {
    consommes.add(nom)
    return encodeURIComponent(enChaine(params[nom]) ?? '')
  })

  const query = new URLSearchParams()
  for (const [cle, valeur] of Object.entries(params)) {
    if (consommes.has(cle) || valeur === undefined || valeur === null) continue
    if (Array.isArray(valeur)) {
      for (const element of valeur) {
        const scalaire = enChaine(element)
        if (scalaire !== null) query.append(cle, scalaire)
      }
      continue
    }
    const scalaire = enChaine(valeur)
    if (scalaire !== null) query.append(cle, scalaire)
  }

  const suffixe = query.toString()
  return suffixe ? `${chemAvecParams}?${suffixe}` : chemAvecParams
}

const fusionnerSchemas = (route: RouteConfig): z.ZodObject<z.ZodRawShape> => {
  const params = route.request?.params as z.ZodObject<z.ZodRawShape> | undefined
  const query = route.request?.query as z.ZodObject<z.ZodRawShape> | undefined
  return z.object({ ...(params?.shape ?? {}), ...(query?.shape ?? {}) })
}

/**
 * Transforme une route de lecture en outil. La description et le schéma sont ceux de la
 * route : quand elle évolue, l'outil suit sans intervention.
 */
export const deriverTool = ({ route }: EntreeWhitelist, requeteur: Requeteur): Tool =>
  tool({
    description: route.description ?? route.summary ?? '',
    inputSchema: fusionnerSchemas(route),
    execute: async (params: Record<string, unknown>) => {
      const reponse = await requeteur(construireUrl(route.path, params))
      if (!reponse.ok) {
        // Une erreur lisible plutôt qu'un throw : le modèle peut corriger son appel ou
        // dire à l'utilisateur qu'il n'a pas accès, au lieu de perdre tout le tour.
        return { erreur: `L'appel a échoué avec le statut ${reponse.status}.` }
      }
      return reponse.json()
    },
  })
