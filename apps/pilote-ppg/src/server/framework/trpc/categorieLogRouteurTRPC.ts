import type { appRouter } from "@/server/app/trpc/appRouter";
import {
  CATEGORIE_LOG_PAR_DEFAUT,
  type CategorieLog,
} from "@/utils/categoriesLog";

type RouteurTRPC = keyof (typeof appRouter)["_def"]["record"];

const CATEGORIE_PAR_ROUTEUR_TRPC: Record<RouteurTRPC, CategorieLog> = {
  actualites: "contenu",
  annuaire: "utilisateur",
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
  referentielAxe: "referentiel",
  parametrageChantier: "referentiel",
  referentielEngagement: "referentiel",
  parametrageIndicateur: "indicateur",
  referentielPerimetre: "referentiel",
  referentielPorteur: "referentiel",
  referentielPpg: "referentiel",
  referentielZonegroup: "referentiel",
  objectif: "chantier",
  parametrageCentreAide: "contenu",
  parametrageNouveautes: "contenu",
  profil: "utilisateur",
  profilUtilisateur: "utilisateur",
  propositionValeurAvancement: "pva",
  perimetreMinisteriel: "referentiel",
  rapportHebdomadaire: "rapport",
  rapportDetaille: "rapport",
  syntheseDesResultats: "chantier",
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
