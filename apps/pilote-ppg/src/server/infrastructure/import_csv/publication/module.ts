import { ImporterPublicationCSVUseCase } from "@/server/infrastructure/import_csv/publication/ImporterPublicationCSVUseCase";
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

type ImportPublicationCSVImports = CommentaireExports &
  ImportSyntheseDesResultatsExports &
  ImportDecisionStrategiqueExports &
  ObjectifExports;

type ImportPublicationCSVOwnCradle = {
  importerPublicationCSVUseCase: ImporterPublicationCSVUseCase;
};

type ImportPublicationCSVCradle = ImportPublicationCSVOwnCradle &
  ImportPublicationCSVImports;

export const importPublicationCSVModule = defineModule<
  NoExports,
  ImportPublicationCSVCradle
>()({
  name: "importPublicationCSV",
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
      importerPublicationCSVUseCase: asModuleClass(
        ImporterPublicationCSVUseCase,
      ),
    } satisfies VerifyCradle<ImportPublicationCSVOwnCradle>);
  },
});

type Scope = ExtractScope<typeof importPublicationCSVModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
