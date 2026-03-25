import { GestionContenuRepository } from "@/server/gestion-contenu/domain/ports/GestionContenuRepository";
import {
  FEATURE_FLIP_KEYS,
  FeatureFlipKey,
  FeatureFlipMap,
} from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import { configuration, configurationFeatureFlip } from "@/config";
import type { Inject } from "@/server/legacy/module";

/** Mapping entre clé d'env et propriété de config.featureFlip */
const ENV_TO_CONFIG_KEY: Record<FeatureFlipKey, string> = {
  NEXT_PUBLIC_FF_NOUVELLE_PAGE_ACCUEIL: "nouvellePageAccueil",
  NEXT_PUBLIC_FF_RAPPORT_DETAILLE: "rapportDetaille",
  NEXT_PUBLIC_FF_INFOBULLE_PONDERATION: "infobullePonderation",
  NEXT_PUBLIC_FF_DATE_METEO: "dateMeteo",
  NEXT_PUBLIC_FF_ALERTES: "alertes",
  NEXT_PUBLIC_FF_ALERTES_BAISSE: "alertesBaisse",
  NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE: "applicationIndisponible",
  NEXT_PUBLIC_FF_FICHE_CONDUCTEUR: "ficheConducteur",
  NEXT_PUBLIC_FF_GESTION_TOKEN_API: "gestionTokenAPI",
  NEXT_PUBLIC_FF_TA_ANNUEL: "taAnnuel",
  NEXT_PUBLIC_FF_SUIVI_COMPLETUDE: "suiviCompletude",
  NEXT_PUBLIC_FF_ALERTE_MAJ_INDICATEUR: "alerteMAJIndicateur",
  NEXT_PUBLIC_FF_DOCS_API: "docsAPI",
  NEXT_PUBLIC_FF_PPG_ARCHIVE: "ppgArchive",
  NEXT_PUBLIC_FF_POSER_UNE_QUESTION_INDICATEUR: "poserUneQuestionIndicateur",
  NEXT_PUBLIC_FF_VIDEO_ACCUEIL: "videoAccueil",
  NEXT_PUBLIC_FF_PANEL_ADMIN: "panelAdmin",
  NEXT_PUBLIC_FF_MON_PROFIL: "monProfil",
  NEXT_PUBLIC_FF_ASK_AI: "askAI",
  NEXT_PUBLIC_FF_CENTRE_AIDE_CUSTOM_PILOTE: "centreAideCustomPilote",
  NEXT_PUBLIC_FF_PILOTE_EVAL: "piloteEval",
  NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS: "rapportCoordinateurs",
  NEXT_PUBLIC_FF_RAPPORT_PVA: "rapportPva",
  NEXT_PUBLIC_FF_CREATION_COMPTE_ARS: "creationCompteArs",
  NEXT_PUBLIC_FF_MASQUER_INDICATEURS_NON_APPLICABLES:
    "masquerIndicateursNonApplicables",
  NEXT_PUBLIC_FF_ACCES_PILOTE: "accesPilote",
  NEXT_PUBLIC_FF_COMPARAISON_TERRITOIRES: "comparaisonTerritoires",
  NEXT_PUBLIC_FF_FICHE_TERRITORIALE: "ficheTerritoriale",
  NEXT_PUBLIC_FF_PROPOSITION_VOIR_HISTORIQUE: "voirHistoriqueProposition",
  NEXT_PUBLIC_FF_PVA_VALEUR_DIFFERENTE: "pvaValeurDifferente",
  NEXT_PUBLIC_FF_LIEN_CONTACT_BREVO: "lienContactBrevo",
};

export class RecupererFeatureFlipsUseCase {
  private gestionContenuRepository: GestionContenuRepository;

  constructor({
    gestionContenuRepository,
  }: Inject<"gestionContenuRepository">) {
    this.gestionContenuRepository = gestionContenuRepository;
  }

  async run(): Promise<FeatureFlipMap> {
    const featureFlipConfig = configurationFeatureFlip() as unknown as Record<
      string,
      boolean
    >;

    // Construire les valeurs depuis la config (env vars)
    const result = {} as FeatureFlipMap;
    for (const key of FEATURE_FLIP_KEYS) {
      const configKey = ENV_TO_CONFIG_KEY[key];
      result[key] = featureFlipConfig[configKey] ?? false;
    }

    // Si le FF admin est désactivé, on retourne uniquement les valeurs config
    if (!configuration().featureFlip.featureFlipAdmin) {
      return result;
    }

    // Récupérer les overrides stockés en DB
    const dbValues =
      await this.gestionContenuRepository.recupererMapVariableContenuParListeDeNom(
        [...FEATURE_FLIP_KEYS],
      );

    // Fusionner : DB > config
    for (const key of FEATURE_FLIP_KEYS) {
      const dbValue = dbValues[key];
      if (dbValue !== undefined) {
        result[key] = dbValue as boolean;
      }
    }

    return result;
  }
}
