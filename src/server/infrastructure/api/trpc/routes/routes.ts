import { créerRouteurTRPC } from "@/server/infrastructure/api/trpc/trpc";
import { utilisateurRouter } from "@/server/infrastructure/api/trpc/routes/utilisateur";
import { metadataIndicateurRouter } from "@/server/infrastructure/api/trpc/routes/metadataIndicateur";
import { gestionContenuRouter } from "@/server/infrastructure/api/trpc/routes/gestionContenu";
import { gestionTokenAPIRouter } from "@/server/infrastructure/api/trpc/routes/gestionTokenAPI";
import { evaluationRouter } from "@/server/infrastructure/api/trpc/routes/evaluation";
import { habilitationsCoordinateurRouter } from "@/server/infrastructure/api/trpc/routes/habilitationsCoordinateur";
import { profilUtilisateurRouter } from "@/server/infrastructure/api/trpc/routes/profilUtilisateur";
import { rapportHebdomadaireRouter } from "@/server/infrastructure/api/trpc/routes/rapportHebdomadaire";
import { chantierRouter } from "./chantier";
import { synthèseDesRésultatsRouter } from "./synthèseDesRésultats";
import { commentaireRouter } from "./commentaire";
import { publicationRouter } from "./publication";
import { indicateurRouter } from "./indicateur";
import { propositionValeurAvancementRouter } from "./propositionValeurAvancement";
import { territoireRouter } from "./territoire";
import { périmètreMinistérielRouter } from "./périmètreMinistériel";
import { profilRouter } from "./profil";
import { parametrageNouveautesRouter } from "./parametrageNouveautes";
import { albertRouter } from "./albert";

export const appRouter = créerRouteurTRPC({
  chantier: chantierRouter,
  synthèseDesRésultats: synthèseDesRésultatsRouter,
  commentaire: commentaireRouter,
  publication: publicationRouter,
  indicateur: indicateurRouter,
  territoire: territoireRouter,
  utilisateur: utilisateurRouter,
  metadataIndicateur: metadataIndicateurRouter,
  propositionValeurAvancement: propositionValeurAvancementRouter,
  gestionContenu: gestionContenuRouter,
  gestionTokenAPI: gestionTokenAPIRouter,
  périmètreMinistériel: périmètreMinistérielRouter,
  profil: profilRouter,
  parametrageNouveautes: parametrageNouveautesRouter,
  evaluation: evaluationRouter,
  habilitationsCoordinateur: habilitationsCoordinateurRouter,
  profilUtilisateur: profilUtilisateurRouter,
  rapportHebdomadaire: rapportHebdomadaireRouter,
  albert: albertRouter,
});
