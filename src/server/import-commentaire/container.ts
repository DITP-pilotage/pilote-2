import { asClass, AwilixContainer } from "awilix";
import { ImportCommentaireAPIHandler } from "@/server/import-commentaire/infrastructure/handlers/ImportCommentaireAPIHandler";
import { ImporterCommentairesUseCase } from "@/server/import-commentaire/usecases/ImporterCommentairesUseCase";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import CommentaireSQLRepository from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type ImportCommentaireDependencies = {
  importCommentaireAPIHandler: ImportCommentaireAPIHandler;
  importerCommentairesUseCase: ImporterCommentairesUseCase;
  commentaireRepository: CommentaireRepository;
};

export const getImportCommentaireContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<
  ImportCommentaireDependencies & { prisma: PrismaPilote }
> => {
  return initialContainer
    .createScope<ImportCommentaireDependencies>()
    .register({
      commentaireRepository: asClass(CommentaireSQLRepository),
      importerCommentairesUseCase: asClass(ImporterCommentairesUseCase),
      importCommentaireAPIHandler: asClass(ImportCommentaireAPIHandler),
    });
};
