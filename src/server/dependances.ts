import { type AwilixContainer } from "awilix";
import { configuration } from "@/config";
import {
  bootModules,
  type ExtractCradle,
  type ModuleName,
} from "@/server/module-system";
import { sharedModule } from "@/server/shared/module";
import { authentificationModule } from "@/server/authentification/module";
import { chantiersModule } from "@/server/chantiers/module";
import { parametrageIndicateurModule } from "@/server/parametrage-indicateur/module";
import { importIndicateurModule } from "@/server/import-indicateur/module";
import { commentaireModule } from "@/server/commentaires/module";
import { importDecisionStrategiqueModule } from "@/server/decisions-strategiques/module";
import { objectifModule } from "@/server/objectifs/module";
import { importSyntheseDesResultatsModule } from "@/server/syntheses-des-resultats/module";
import { ficheConducteurModule } from "@/server/fiche-conducteur/module";
import { piloteEvalModule } from "@/server/evaluation/module";
import { applicationLogModule } from "@/server/application-log/module";
import { gestionUtilisateurModule } from "./gestion-utilisateur/module";
import { parametrageNouveautesModule } from "./parametrage-nouveautes/module";
import { indicateurTerritoireValeurEvenementModule } from "./indicateur-territoire-valeur-evenement/module";
import { habilitationsCoordinateurModule } from "./habilitations-coordinateur/module";
import { profilUtilisateurModule } from "./profil-utilisateur/module";
import { rapportsHebdomadairesModule } from "./rapports-hebdomadaires/module";
import { albertModule } from "./albert/module";
import { parametrageCentreAideModule } from "./parametrage-centre-aide/module";
import { datajobsExecutionModule } from "./datajobs-execution/module";
import { legacyModule } from "./legacy/module";

const allModules = [
  sharedModule,
  authentificationModule,
  chantiersModule,
  parametrageIndicateurModule,
  importIndicateurModule,
  commentaireModule,
  importDecisionStrategiqueModule,
  objectifModule,
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
  datajobsExecutionModule,
  legacyModule,
  applicationLogModule,
];

// Compile-time check: errors with missing module name(s) if allModules is not exhaustive
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AssertExhaustiveModules =
  Exclude<ModuleName, (typeof allModules)[number]["name"]> extends never
    ? true
    : never;

type AllModuleDefs = (typeof allModules)[number];
export type ContainerDependencies = {
  [M in AllModuleDefs as M["name"]]: AwilixContainer<ExtractCradle<M>>;
};

function registerContainer(): ContainerDependencies {
  const { getContainer } = bootModules(allModules);

  return {
    shared: getContainer("shared"),
    authentification: getContainer("authentification"),
    chantiers: getContainer("chantiers"),
    parametrageIndicateur: getContainer("parametrageIndicateur"),
    importIndicateur: getContainer("importIndicateur"),
    commentaires: getContainer("commentaires"),
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
    decisionStrategique: getContainer("decisionStrategique"),
    objectif: getContainer("objectif"),
    importSyntheseDesResultats: getContainer("importSyntheseDesResultats"),
    datajobsExecution: getContainer("datajobsExecution"),
    legacy: getContainer("legacy"),
    applicationLog: getContainer("applicationLog"),
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
