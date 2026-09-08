import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";
import {
  CATEGORIE_LOG_PAR_DEFAUT,
  type CategorieLog,
} from "@/utils/categoriesLog";

type RouteurTRPC = keyof (typeof appRouter)["_def"]["record"];

const CATEGORIE_PAR_ROUTEUR_TRPC: Record<RouteurTRPC, CategorieLog> = {
  actualites: "contenu",
  albert: "albert",
  applicationLog: "maintenance",
  chantier: "chantier",
  commentaire: "chantier",
  decisionStrategique: "chantier",
  evaluation: "evaluation",
  gestionContenu: "contenu",
  gestionTokenAPI: "auth",
  habilitationsCoordinateur: "utilisateur",
  indicateur: "indicateur",
  metadataAxe: "referentiel",
  metadataChantier: "referentiel",
  metadataEngagement: "referentiel",
  metadataIndicateur: "indicateur",
  metadataPerimetre: "referentiel",
  metadataPorteur: "referentiel",
  metadataPpg: "referentiel",
  metadataZonegroup: "referentiel",
  objectif: "chantier",
  parametrageCentreAide: "contenu",
  parametrageNouveautes: "contenu",
  profil: "utilisateur",
  profilUtilisateur: "utilisateur",
  propositionValeurAvancement: "pva",
  périmètreMinistériel: "referentiel",
  rapportHebdomadaire: "rapport",
  synthèseDesRésultats: "chantier",
  territoire: "referentiel",
  utilisateur: "utilisateur",
};

export function categorieDepuisRouteurTRPC(
  path: string | undefined,
): CategorieLog {
  const routeur = path?.split(".")[0] ?? "";
  return (
    CATEGORIE_PAR_ROUTEUR_TRPC[routeur as RouteurTRPC] ??
    CATEGORIE_LOG_PAR_DEFAUT
  );
}
