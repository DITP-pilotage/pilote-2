/**
 * Les territoires sur lesquels porte un appel d'outil. Le LLM désigne un
 * ensemble (« toutes les régions », « la Bretagne et ses départements ») au
 * lieu d'énumérer ses territoires : il n'a pas à boucler, ni de risque d'en
 * oublier (PIL-1900). Les champs sont en snake_case : c'est le contrat que le
 * LLM remplit.
 */
export type Perimetre =
  | { type: "SELECTION"; territoire_codes: string[] }
  | { type: "REGION_ET_SES_DEPARTEMENTS"; region_code: string }
  | { type: "FRANCE_ET_SES_REGIONS" }
  | { type: "TOUTES_REGIONS" }
  | { type: "TOUS_DEPARTEMENTS" }
  | { type: "TOUS_TERRITOIRES" };
