import { AwilixContainer } from "awilix";
import {
  getParametrageIndicateurContainer,
  ParametrageIndicateurDependencies,
} from "@/server/parametrage-indicateur/container";
import {
  ChantierDependencies,
  getChantiersContainer,
} from "@/server/chantiers/container";
import {
  getImportIndicateurContainer,
  ImportIndicateurDependencies,
} from "@/server/import-indicateur/container";
import {
  AuthentificationDependencies,
  getAuthentificationContainer,
} from "@/server/authentification/container";
import {
  FicheConducteurDependencies,
  getFicheConducteurContainer,
} from "@/server/fiche-conducteur/container";
import {
  getPiloteEvalContainer,
  PiloteEvalDependencies,
} from "@/server/evaluation/container";
import { configuration } from "@/config";
import {
  getImportCommentaireContainer,
  ImportCommentaireDependencies,
  getCommentairesContainer,
  CommentairesDependencies,
} from "@/server/commentaires/container";
import {
  getImportDecisionStrategiqueContainer,
  ImportDecisionStrategiqueDependencies,
} from "@/server/decisions-strategiques/container";
import {
  getImportObjectifContainer,
  ImportObjectifDependencies,
} from "@/server/objectifs/container";
import {
  getImportSyntheseDesResultatsContainer,
  ImportSyntheseDesResultatsDependencies,
} from "@/server/syntheses-des-resultats/container";
import {
  GestionUtilisateurDependencies,
  getGestionUtilisateurContainer,
} from "./gestion-utilisateur/container";
import {
  getParametrageNouveautesContainer,
  ParametrageNouveautesDependencies,
} from "./parametrage-nouveautes/container";
import {
  getInitialContainerWithTransversalDependencies,
  InitialDependencies,
} from "./InitialDependencies";
import {
  getIndicateurTerritoireValeurEvenementContainer,
  IndicateurTerritoireValeurEvenementDependencies,
} from "./indicateur-territoire-valeur-evenement/container";
import {
  getHabilitationsCoordinateurContainer,
  HabilitationsCoordinateurDependencies,
} from "./habilitations-coordinateur/container";
import {
  getProfilUtilisateurContainer,
  ProfilUtilisateurDependencies,
} from "./profil-utilisateur/container";
import {
  getRapportsHebdomadairesContainer,
  RapportsHebdomadairesDependencies,
} from "./rapports-hebdomadaires/container";
import { getAlbertContainer, AlbertDependencies } from "./albert/container";

export type ContainerDependencies = {
  main: AwilixContainer<InitialDependencies>;
  authentification: AwilixContainer<AuthentificationDependencies>;
  chantiers: AwilixContainer<ChantierDependencies>;
  parametrageIndicateur: AwilixContainer<ParametrageIndicateurDependencies>;
  importIndicateur: AwilixContainer<ImportIndicateurDependencies>;
  importCommentaire: AwilixContainer<ImportCommentaireDependencies>;
  commentaires: AwilixContainer<CommentairesDependencies>;
  gestionUtilisateur: AwilixContainer<GestionUtilisateurDependencies>;
  ficheConducteur: AwilixContainer<FicheConducteurDependencies>;
  parametrageNouveautes: AwilixContainer<ParametrageNouveautesDependencies>;
  indicateurTerritoireValeurEvenement: AwilixContainer<IndicateurTerritoireValeurEvenementDependencies>;
  piloteEval: AwilixContainer<PiloteEvalDependencies>;
  habilitationsCoordinateur: AwilixContainer<HabilitationsCoordinateurDependencies>;
  profilUtilisateur: AwilixContainer<ProfilUtilisateurDependencies>;
  rapportsHebdomadaires: AwilixContainer<RapportsHebdomadairesDependencies>;
  albert: AwilixContainer<AlbertDependencies>;
  importDecisionStrategique: AwilixContainer<ImportDecisionStrategiqueDependencies>;
  importObjectif: AwilixContainer<ImportObjectifDependencies>;
  importSyntheseDesResultats: AwilixContainer<ImportSyntheseDesResultatsDependencies>;
};

function registerContainer(): ContainerDependencies {
  const initialContainerWithTransversalDependencies =
    getInitialContainerWithTransversalDependencies();

  return {
    main: initialContainerWithTransversalDependencies.createScope(),
    authentification: getAuthentificationContainer(
      initialContainerWithTransversalDependencies,
    ),
    chantiers: getChantiersContainer(
      initialContainerWithTransversalDependencies,
    ),
    parametrageIndicateur: getParametrageIndicateurContainer(
      initialContainerWithTransversalDependencies,
    ),
    importIndicateur: getImportIndicateurContainer(
      initialContainerWithTransversalDependencies,
    ),
    importCommentaire: getImportCommentaireContainer(
      initialContainerWithTransversalDependencies,
    ),
    commentaires: getCommentairesContainer(
      initialContainerWithTransversalDependencies,
    ),
    gestionUtilisateur: getGestionUtilisateurContainer(
      initialContainerWithTransversalDependencies,
    ),
    ficheConducteur: getFicheConducteurContainer(
      initialContainerWithTransversalDependencies,
    ),
    parametrageNouveautes: getParametrageNouveautesContainer(
      initialContainerWithTransversalDependencies,
    ),
    indicateurTerritoireValeurEvenement:
      getIndicateurTerritoireValeurEvenementContainer(
        initialContainerWithTransversalDependencies,
      ),
    piloteEval: getPiloteEvalContainer(
      initialContainerWithTransversalDependencies,
    ),
    habilitationsCoordinateur: getHabilitationsCoordinateurContainer(
      initialContainerWithTransversalDependencies,
    ),
    profilUtilisateur: getProfilUtilisateurContainer(
      initialContainerWithTransversalDependencies,
    ),
    rapportsHebdomadaires: getRapportsHebdomadairesContainer(
      initialContainerWithTransversalDependencies,
    ),
    albert: getAlbertContainer(initialContainerWithTransversalDependencies),
    importDecisionStrategique: getImportDecisionStrategiqueContainer(
      initialContainerWithTransversalDependencies,
    ),
    importObjectif: getImportObjectifContainer(
      initialContainerWithTransversalDependencies,
    ),
    importSyntheseDesResultats: getImportSyntheseDesResultatsContainer(
      initialContainerWithTransversalDependencies,
    ),
  };
}

let innerContainer: ContainerDependencies;

declare global {
  var __container: ContainerDependencies | undefined;
}

if (configuration().env === "production") {
  if (!global.__container) {
    global.__container = registerContainer();
  }
  innerContainer = global.__container;
} else {
  innerContainer = registerContainer();
}

export const getContainer = <T extends keyof ContainerDependencies>(
  nameDependency: T,
) => innerContainer[nameDependency];
