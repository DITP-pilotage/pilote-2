import { ImportCommentaireAPIHandler } from "@/server/commentaires/infrastructure/handlers/ImportCommentaireAPIHandler";
import { ImporterCommentairesUseCase } from "@/server/commentaires/usecases/ImporterCommentairesUseCase";
import { PublierCommentaireUseCase } from "@/server/commentaires/usecases/PublierCommentaireUseCase";
import { EnregistrerBrouillonCommentaireUseCase } from "@/server/commentaires/usecases/EnregistrerBrouillonCommentaireUseCase";
import { ModifierCommentairePublieUseCase } from "@/server/commentaires/usecases/ModifierCommentairePublieUseCase";
import { PublierBrouillonCommentaireUseCase } from "@/server/commentaires/usecases/PublierBrouillonCommentaireUseCase";
import { ModifierBrouillonCommentaireUseCase } from "@/server/commentaires/usecases/ModifierBrouillonCommentaireUseCase";
import { RecupererDernierCommentaireQuery } from "@/server/commentaires/queries/RecupererDernierCommentaireQuery";
import { RecupererBrouillonCommentaireQuery } from "@/server/commentaires/queries/RecupererBrouillonCommentaireQuery";
import { RecupererHistoriqueCommentaireQuery } from "@/server/commentaires/queries/RecupererHistoriqueCommentaireQuery";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import CommentaireSQLRepository from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";

type CommentaireCradle = {
  importCommentaireAPIHandler: ImportCommentaireAPIHandler;
  importerCommentairesUseCase: ImporterCommentairesUseCase;
  publierCommentaireUseCase: PublierCommentaireUseCase;
  enregistrerBrouillonCommentaireUseCase: EnregistrerBrouillonCommentaireUseCase;
  modifierCommentairePublieUseCase: ModifierCommentairePublieUseCase;
  publierBrouillonCommentaireUseCase: PublierBrouillonCommentaireUseCase;
  modifierBrouillonCommentaireUseCase: ModifierBrouillonCommentaireUseCase;
  recupererDernierCommentaireQuery: RecupererDernierCommentaireQuery;
  recupererBrouillonCommentaireQuery: RecupererBrouillonCommentaireQuery;
  recupererHistoriqueCommentaireQuery: RecupererHistoriqueCommentaireQuery;
  commentaireRepository: CommentaireRepository;
};

export const commentaireModule = defineModule<NoExports, CommentaireCradle>()({
  name: "commentaires",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      commentaireRepository: asModuleClass(CommentaireSQLRepository),
      importerCommentairesUseCase: asModuleClass(ImporterCommentairesUseCase),
      importCommentaireAPIHandler: asModuleClass(ImportCommentaireAPIHandler),
      publierCommentaireUseCase: asModuleClass(PublierCommentaireUseCase),
      enregistrerBrouillonCommentaireUseCase: asModuleClass(
        EnregistrerBrouillonCommentaireUseCase,
      ),
      modifierCommentairePublieUseCase: asModuleClass(
        ModifierCommentairePublieUseCase,
      ),
      publierBrouillonCommentaireUseCase: asModuleClass(
        PublierBrouillonCommentaireUseCase,
      ),
      modifierBrouillonCommentaireUseCase: asModuleClass(
        ModifierBrouillonCommentaireUseCase,
      ),
      recupererDernierCommentaireQuery: asModuleClass(
        RecupererDernierCommentaireQuery,
      ),
      recupererBrouillonCommentaireQuery: asModuleClass(
        RecupererBrouillonCommentaireQuery,
      ),
      recupererHistoriqueCommentaireQuery: asModuleClass(
        RecupererHistoriqueCommentaireQuery,
      ),
    } satisfies VerifyCradle<CommentaireCradle>);
  },
});

type Scope = ExtractScope<typeof commentaireModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
