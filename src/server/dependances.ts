import { type AwilixContainer } from "awilix";
import { configuration } from "@/config";
import { bootModules } from "@/server/module-system";
import { sharedModule, type SharedDependencies } from "@/server/shared/module";
import {
  authentificationModule,
  type AuthentificationDependencies,
} from "@/server/authentification/module";
import {
  chantiersModule,
  type ChantierDependencies,
} from "@/server/chantiers/module";
import {
  parametrageIndicateurModule,
  type ParametrageIndicateurDependencies,
} from "@/server/parametrage-indicateur/module";
import {
  importIndicateurModule,
  type ImportIndicateurDependencies,
} from "@/server/import-indicateur/module";
import {
  importCommentaireModule,
  type ImportCommentaireDependencies,
} from "@/server/commentaires/module";
import {
  importDecisionStrategiqueModule,
  type ImportDecisionStrategiqueDependencies,
} from "@/server/decisions-strategiques/module";
import {
  importObjectifModule,
  type ImportObjectifDependencies,
} from "@/server/objectifs/module";
import {
  importSyntheseDesResultatsModule,
  type ImportSyntheseDesResultatsDependencies,
} from "@/server/syntheses-des-resultats/module";
import {
  ficheConducteurModule,
  type FicheConducteurDependencies,
} from "@/server/fiche-conducteur/module";
import {
  piloteEvalModule,
  type PiloteEvalDependencies,
} from "@/server/evaluation/module";
import {
  gestionUtilisateurModule,
  type GestionUtilisateurDependencies,
} from "./gestion-utilisateur/module";
import {
  parametrageNouveautesModule,
  type ParametrageNouveautesDependencies,
} from "./parametrage-nouveautes/module";
import {
  indicateurTerritoireValeurEvenementModule,
  type IndicateurTerritoireValeurEvenementDependencies,
} from "./indicateur-territoire-valeur-evenement/module";
import {
  habilitationsCoordinateurModule,
  type HabilitationsCoordinateurDependencies,
} from "./habilitations-coordinateur/module";
import {
  profilUtilisateurModule,
  type ProfilUtilisateurDependencies,
} from "./profil-utilisateur/module";
import {
  rapportsHebdomadairesModule,
  type RapportsHebdomadairesDependencies,
} from "./rapports-hebdomadaires/module";
import { albertModule, type AlbertDependencies } from "./albert/module";
import {
  parametrageCentreAideModule,
  type ParametrageCentreAideDependencies,
} from "./parametrage-centre-aide/module";
import { legacyModule, type LegacyDependencies } from "./legacy/module";

export type ContainerDependencies = {
  shared: AwilixContainer<SharedDependencies>;
  authentification: AwilixContainer<AuthentificationDependencies>;
  chantiers: AwilixContainer<ChantierDependencies>;
  parametrageIndicateur: AwilixContainer<ParametrageIndicateurDependencies>;
  importIndicateur: AwilixContainer<ImportIndicateurDependencies>;
  importCommentaire: AwilixContainer<ImportCommentaireDependencies>;
  gestionUtilisateur: AwilixContainer<GestionUtilisateurDependencies>;
  ficheConducteur: AwilixContainer<FicheConducteurDependencies>;
  parametrageNouveautes: AwilixContainer<ParametrageNouveautesDependencies>;
  indicateurTerritoireValeurEvenement: AwilixContainer<IndicateurTerritoireValeurEvenementDependencies>;
  piloteEval: AwilixContainer<PiloteEvalDependencies>;
  habilitationsCoordinateur: AwilixContainer<HabilitationsCoordinateurDependencies>;
  profilUtilisateur: AwilixContainer<ProfilUtilisateurDependencies>;
  rapportsHebdomadaires: AwilixContainer<RapportsHebdomadairesDependencies>;
  albert: AwilixContainer<AlbertDependencies>;
  parametrageCentreAide: AwilixContainer<ParametrageCentreAideDependencies>;
  importDecisionStrategique: AwilixContainer<ImportDecisionStrategiqueDependencies>;
  importObjectif: AwilixContainer<ImportObjectifDependencies>;
  importSyntheseDesResultats: AwilixContainer<ImportSyntheseDesResultatsDependencies>;
  legacy: AwilixContainer<LegacyDependencies>;
};

const allModules = [
  sharedModule,
  authentificationModule,
  chantiersModule,
  parametrageIndicateurModule,
  importIndicateurModule,
  importCommentaireModule,
  importDecisionStrategiqueModule,
  importObjectifModule,
  importSyntheseDesResultatsModule,
  gestionUtilisateurModule,
  ficheConducteurModule,
  parametrageNouveautesModule,
  indicateurTerritoireValeurEvenementModule,
  piloteEvalModule,
  habilitationsCoordinateurModule,
  profilUtilisateurModule,
  rapportsHebdomadairesModule,
  albertModule,
  parametrageCentreAideModule,
  legacyModule,
];

function registerContainer(): ContainerDependencies {
  const { getContainer } = bootModules(allModules);

  return {
    shared: getContainer("shared"),
    authentification: getContainer("authentification"),
    chantiers: getContainer("chantiers"),
    parametrageIndicateur: getContainer("parametrageIndicateur"),
    importIndicateur: getContainer("importIndicateur"),
    importCommentaire: getContainer("importCommentaire"),
    gestionUtilisateur: getContainer("gestionUtilisateur"),
    ficheConducteur: getContainer("ficheConducteur"),
    parametrageNouveautes: getContainer("parametrageNouveautes"),
    indicateurTerritoireValeurEvenement: getContainer(
      "indicateurTerritoireValeurEvenement",
    ),
    piloteEval: getContainer("piloteEval"),
    habilitationsCoordinateur: getContainer("habilitationsCoordinateur"),
    profilUtilisateur: getContainer("profilUtilisateur"),
    rapportsHebdomadaires: getContainer("rapportsHebdomadaires"),
    albert: getContainer("albert"),
    parametrageCentreAide: getContainer("parametrageCentreAide"),
    importDecisionStrategique: getContainer("importDecisionStrategique"),
    importObjectif: getContainer("importObjectif"),
    importSyntheseDesResultats: getContainer("importSyntheseDesResultats"),
    legacy: getContainer("legacy"),
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
