import { asClass } from "awilix";
import { ImportCommentaireAPIHandler } from "@/server/commentaires/infrastructure/handlers/ImportCommentaireAPIHandler";
import { ImporterCommentairesUseCase } from "@/server/commentaires/usecases/ImporterCommentairesUseCase";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import CommentaireSQLRepository from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import { defineModule, type NoExports } from "@/server/module-system";

type ImportCommentaireCradle = NoExports & {
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
  register: (container) => {
    container.register({
      commentaireRepository: asClass(CommentaireSQLRepository),
      importerCommentairesUseCase: asClass(ImporterCommentairesUseCase),
      importCommentaireAPIHandler: asClass(ImportCommentaireAPIHandler),
    });
  },
});
