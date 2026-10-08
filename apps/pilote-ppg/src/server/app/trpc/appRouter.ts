import { createTRPCRouter } from "@/server/framework/trpc/trpc";
import { utilisateurRouter } from "@/server/gestion-utilisateur/infrastructure/trpc/utilisateur";
import { parametrageIndicateurRouter } from "@/server/parametrage-indicateur/infrastructure/trpc/parametrageIndicateur";
import { gestionContenuRouter } from "@/server/gestion-contenu/infrastructure/trpc/gestionContenu";
import { gestionTokenAPIRouter } from "@/server/authentification/infrastructure/trpc/gestionTokenAPI";
import { evaluationRouter } from "@/server/evaluation/infrastructure/trpc/evaluation";
import { habilitationsCoordinateurRouter } from "@/server/habilitations-coordinateur/infrastructure/trpc/habilitationsCoordinateur";
import { profilUtilisateurRouter } from "@/server/profil-utilisateur/infrastructure/trpc/profilUtilisateur";
import { rapportHebdomadaireRouter } from "@/server/rapports-hebdomadaires/infrastructure/trpc/rapportHebdomadaire";
import { rapportDetailleRouter } from "@/server/rapport-detaille/infrastructure/trpc/rapportDetaille";
import { chantierRouter } from "@/server/chantiers/infrastructure/trpc/chantier";
import { syntheseDesResultatsRouter } from "@/server/syntheses-des-resultats/infrastructure/trpc/syntheseDesResultats";
import { commentaireRouter } from "@/server/commentaires/infrastructure/trpc/commentaire";
import { decisionStrategiqueRouter } from "@/server/decisions-strategiques/infrastructure/trpc/decisionStrategique";
import { objectifRouter } from "@/server/objectifs/infrastructure/trpc/objectif";
import { indicateurRouter } from "@/server/chantiers/infrastructure/trpc/indicateur";
import { propositionValeurAvancementRouter } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/trpc/propositionValeurAvancement";
import { territoireRouter } from "@/server/gestion-utilisateur/infrastructure/trpc/territoire";
import { perimetreMinisterielRouter } from "@/server/gestion-utilisateur/infrastructure/trpc/perimetreMinisteriel";
import { profilRouter } from "@/server/gestion-utilisateur/infrastructure/trpc/profil";
import { parametrageNouveautesRouter } from "@/server/parametrage-nouveautes/infrastructure/trpc/parametrageNouveautes";
import { albertRouter } from "@/server/albert/infrastructure/trpc/albert";
import { parametrageCentreAideRouter } from "@/server/parametrage-centre-aide/infrastructure/trpc/parametrageCentreAide";
import { applicationLogRouter } from "@/server/application-log/infrastructure/trpc/applicationLog";
import { actualitesRouter } from "@/server/actualites/infrastructure/trpc/actualites";
import { parametrageChantierRouter } from "@/server/parametrage-chantier/infrastructure/trpc/parametrageChantier";
import { referentielPorteurRouter } from "@/server/referentiels/porteur/infrastructure/trpc/referentielPorteur";
import { referentielPerimetreRouter } from "@/server/referentiels/perimetre/infrastructure/trpc/referentielPerimetre";
import { referentielZonegroupRouter } from "@/server/referentiels/zonegroup/infrastructure/trpc/referentielZonegroup";
import { referentielAxeRouter } from "@/server/referentiels/axe/infrastructure/trpc/referentielAxe";
import { referentielPpgRouter } from "@/server/referentiels/ppg/infrastructure/trpc/referentielPpg";
import { referentielEngagementRouter } from "@/server/referentiels/engagement/infrastructure/trpc/referentielEngagement";
import { annuaireRouter } from "@/server/annuaire/infrastructure/trpc/annuaire";

export const appRouter = createTRPCRouter({
  chantier: chantierRouter,
  syntheseDesResultats: syntheseDesResultatsRouter,
  commentaire: commentaireRouter,
  decisionStrategique: decisionStrategiqueRouter,
  objectif: objectifRouter,
  indicateur: indicateurRouter,
  territoire: territoireRouter,
  utilisateur: utilisateurRouter,
  parametrageIndicateur: parametrageIndicateurRouter,
  propositionValeurAvancement: propositionValeurAvancementRouter,
  gestionContenu: gestionContenuRouter,
  gestionTokenAPI: gestionTokenAPIRouter,
  perimetreMinisteriel: perimetreMinisterielRouter,
  profil: profilRouter,
  parametrageNouveautes: parametrageNouveautesRouter,
  evaluation: evaluationRouter,
  habilitationsCoordinateur: habilitationsCoordinateurRouter,
  profilUtilisateur: profilUtilisateurRouter,
  rapportHebdomadaire: rapportHebdomadaireRouter,
  rapportDetaille: rapportDetailleRouter,
  albert: albertRouter,
  parametrageCentreAide: parametrageCentreAideRouter,
  applicationLog: applicationLogRouter,
  actualites: actualitesRouter,
  parametrageChantier: parametrageChantierRouter,
  referentielPorteur: referentielPorteurRouter,
  referentielPerimetre: referentielPerimetreRouter,
  referentielZonegroup: referentielZonegroupRouter,
  referentielAxe: referentielAxeRouter,
  referentielPpg: referentielPpgRouter,
  referentielEngagement: referentielEngagementRouter,
  annuaire: annuaireRouter,
});
