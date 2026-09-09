import { ImporterDonneesChantierCSVUseCase } from "@/server/infrastructure/import_csv/donnees_chantier/ImporterDonneesChantierCSVUseCase";
import type { CommentaireExports } from "@/server/commentaires/module";
import type { ImportSyntheseDesResultatsExports } from "@/server/syntheses-des-resultats/module";
import type { ImportDecisionStrategiqueExports } from "@/server/decisions-strategiques/module";
import type { ObjectifExports } from "@/server/objectifs/module";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";

type ImportDonneesChantierCSVImports = CommentaireExports &
  ImportSyntheseDesResultatsExports &
  ImportDecisionStrategiqueExports &
  ObjectifExports;

type ImportDonneesChantierCSVOwnCradle = {
  importerDonneesChantierCSVUseCase: ImporterDonneesChantierCSVUseCase;
};

type ImportDonneesChantierCSVCradle = ImportDonneesChantierCSVOwnCradle &
  ImportDonneesChantierCSVImports;

export const importDonneesChantierCSVModule = defineModule<
  NoExports,
  ImportDonneesChantierCSVCradle
>()({
  name: "importDonneesChantierCSV",
  imports: [
    "shared",
    "commentaires",
    "importSyntheseDesResultats",
    "decisionStrategique",
    "objectif",
  ],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      importerDonneesChantierCSVUseCase: asModuleClass(
        ImporterDonneesChantierCSVUseCase,
      ),
    } satisfies VerifyCradle<ImportDonneesChantierCSVOwnCradle>);
  },
});

type Scope = ExtractScope<typeof importDonneesChantierCSVModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
