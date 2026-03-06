import { asClass, AwilixContainer } from "awilix";
import { ImportCommentaireAPIHandler } from "@/server/commentaires/infrastructure/handlers/ImportCommentaireAPIHandler";
import { ImporterCommentairesUseCase } from "@/server/commentaires/usecases/ImporterCommentairesUseCase";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import CommentaireSQLRepository from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PublierCommentaireUseCase } from "@/server/commentaires/usecases/PublierCommentaireUseCase";
import { EnregistrerBrouillonCommentaireUseCase } from "@/server/commentaires/usecases/EnregistrerBrouillonCommentaireUseCase";
import { ModifierCommentairePublieUseCase } from "@/server/commentaires/usecases/ModifierCommentairePublieUseCase";
import { PublierBrouillonCommentaireUseCase } from "@/server/commentaires/usecases/PublierBrouillonCommentaireUseCase";
import { ModifierBrouillonCommentaireUseCase } from "@/server/commentaires/usecases/ModifierBrouillonCommentaireUseCase";
import { RecupererDernierCommentaireQuery } from "@/server/commentaires/queries/RecupererDernierCommentaireQuery";
import { RecupererDernierBrouillonCommentaireQuery } from "@/server/commentaires/queries/RecupererDernierBrouillonCommentaireQuery";
import { RecupererHistoriqueCommentaireQuery } from "@/server/commentaires/queries/RecupererHistoriqueCommentaireQuery";

export type ImportCommentaireDependencies = {
  importCommentaireAPIHandler: ImportCommentaireAPIHandler;
  importerCommentairesUseCase: ImporterCommentairesUseCase;
  commentaireRepository: CommentaireRepository;
};

export type CommentairesDependencies = {
  publierCommentaireUseCase: PublierCommentaireUseCase;
  enregistrerBrouillonCommentaireUseCase: EnregistrerBrouillonCommentaireUseCase;
  modifierCommentairePublieUseCase: ModifierCommentairePublieUseCase;
  publierBrouillonCommentaireUseCase: PublierBrouillonCommentaireUseCase;
  modifierBrouillonCommentaireUseCase: ModifierBrouillonCommentaireUseCase;
  recupererDernierCommentaireQuery: RecupererDernierCommentaireQuery;
  recupererDernierBrouillonCommentaireQuery: RecupererDernierBrouillonCommentaireQuery;
  recupererHistoriqueCommentaireQuery: RecupererHistoriqueCommentaireQuery;
  commentaireRepository: CommentaireRepository;
};

export const getCommentairesContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<CommentairesDependencies & { prisma: PrismaPilote }> => {
  return initialContainer.createScope<CommentairesDependencies>().register({
    commentaireRepository: asClass(CommentaireSQLRepository),
    publierCommentaireUseCase: asClass(PublierCommentaireUseCase),
    enregistrerBrouillonCommentaireUseCase: asClass(
      EnregistrerBrouillonCommentaireUseCase,
    ),
    modifierCommentairePublieUseCase: asClass(ModifierCommentairePublieUseCase),
    publierBrouillonCommentaireUseCase: asClass(
      PublierBrouillonCommentaireUseCase,
    ),
    modifierBrouillonCommentaireUseCase: asClass(
      ModifierBrouillonCommentaireUseCase,
    ),
    recupererDernierCommentaireQuery: asClass(RecupererDernierCommentaireQuery),
    recupererDernierBrouillonCommentaireQuery: asClass(
      RecupererDernierBrouillonCommentaireQuery,
    ),
    recupererHistoriqueCommentaireQuery: asClass(
      RecupererHistoriqueCommentaireQuery,
    ),
  });
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
