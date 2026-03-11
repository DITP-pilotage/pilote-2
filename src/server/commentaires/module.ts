import { ImportCommentaireAPIHandler } from "@/server/commentaires/infrastructure/handlers/ImportCommentaireAPIHandler";
import { ImporterCommentairesUseCase } from "@/server/commentaires/usecases/ImporterCommentairesUseCase";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import CommentaireSQLRepository from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
} from "@/server/module-system";

type ImportCommentaireCradle = {
  importCommentaireAPIHandler: ImportCommentaireAPIHandler;
  importerCommentairesUseCase: ImporterCommentairesUseCase;
  commentaireRepository: CommentaireRepository;
};

export const importCommentaireModule = defineModule<
  NoExports,
  ImportCommentaireCradle
>()({
  name: "importCommentaire",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      commentaireRepository: asModuleClass(CommentaireSQLRepository),
      importerCommentairesUseCase: asModuleClass(ImporterCommentairesUseCase),
      importCommentaireAPIHandler: asModuleClass(ImportCommentaireAPIHandler),
    });
  },
});

type Scope = ExtractScope<typeof importCommentaireModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
