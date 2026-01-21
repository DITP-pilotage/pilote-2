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
  getProfilUtilisateurContainer,
  ProfilUtilisateurDependencies,
} from "./profil-utilisateur/container";

export type ContainerDependencies = {
  main: AwilixContainer<InitialDependencies>;
  authentification: AwilixContainer<AuthentificationDependencies>;
  chantiers: AwilixContainer<ChantierDependencies>;
  parametrageIndicateur: AwilixContainer<ParametrageIndicateurDependencies>;
  importIndicateur: AwilixContainer<ImportIndicateurDependencies>;
  gestionUtilisateur: AwilixContainer<GestionUtilisateurDependencies>;
  ficheConducteur: AwilixContainer<FicheConducteurDependencies>;
  parametrageNouveautes: AwilixContainer<ParametrageNouveautesDependencies>;
  indicateurTerritoireValeurEvenement: AwilixContainer<IndicateurTerritoireValeurEvenementDependencies>;
  piloteEval: AwilixContainer<PiloteEvalDependencies>;
  profilUtilisateur: AwilixContainer<ProfilUtilisateurDependencies>;
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
    profilUtilisateur: getProfilUtilisateurContainer(
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
