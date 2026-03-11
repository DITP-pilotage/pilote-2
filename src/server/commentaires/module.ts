import { asClass } from "awilix";
import { ImportCommentaireAPIHandler } from "@/server/commentaires/infrastructure/handlers/ImportCommentaireAPIHandler";
import { ImporterCommentairesUseCase } from "@/server/commentaires/usecases/ImporterCommentairesUseCase";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import CommentaireSQLRepository from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import { defineModule } from "@/server/module-system";

type ImportCommentaireExports = Record<string, never>;

type ImportCommentaireCradle = ImportCommentaireExports & {
  importCommentaireAPIHandler: ImportCommentaireAPIHandler;
  importerCommentairesUseCase: ImporterCommentairesUseCase;
  commentaireRepository: CommentaireRepository;
};

export type ImportCommentaireDependencies = ImportCommentaireCradle;

export const importCommentaireModule = defineModule<
  ImportCommentaireExports,
  ImportCommentaireCradle
>()({
  name: "importCommentaire",
  imports: ["shared"],
  exports: [],
  register: (container) => {
    container.register({
      commentaireRepository: asClass(CommentaireSQLRepository),
      importerCommentairesUseCase: asClass(ImporterCommentairesUseCase),
      importCommentaireAPIHandler: asClass(ImportCommentaireAPIHandler),
    });
  },
});
