import { FicheConducteurHandler } from "@/server/fiche-conducteur/infrastructure/handlers/FicheConducteurHandler";
import { ChantierRepository } from "@/server/fiche-conducteur/domain/ports/ChantierRepository";
import { PrismaChantierRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaChantierRepository";
import { IndicateurRepository } from "@/server/fiche-conducteur/domain/ports/IndicateurRepository";
import { PrismaIndicateurRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaIndicateurRepository";
import { RecupererChantierFicheConducteurUseCase } from "@/server/fiche-conducteur/usecases/RecupererChantierFicheConducteurUseCase";
import { ObjectifRepository } from "@/server/fiche-conducteur/domain/ports/ObjectifRepository";
import { PrismaObjectifRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaObjectifRepository";
import { PrismaCommentaireRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaCommentaireRepository";
import { PrismaDecisionStrategiqueRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaDecisionStrategiqueRepository";
import { CommentaireRepository } from "@/server/fiche-conducteur/domain/ports/CommentaireRepository";
import { DecisionStrategiqueRepository } from "@/server/fiche-conducteur/domain/ports/DecisionStrategiqueRepository";
import { RecupererPublicationsUseCase } from "@/server/fiche-conducteur/usecases/RecupererPublicationsUseCase";
import { RecupererAvancementUseCase } from "@/server/fiche-conducteur/usecases/RecupererAvancementUseCase";
import { RecupererDerniereSyntheseDesResultatsUseCase } from "@/server/fiche-conducteur/usecases/RecupererDerniereSyntheseDesResultatsUseCase";
import { RecupererDonneesCartographieUseCase } from "@/server/fiche-conducteur/usecases/RecupererDonneesCartographieUseCase";
import { PrismaSyntheseDesResultatsRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaSyntheseDesResultatsRepository";
import { SyntheseDesResultatsRepository } from "@/server/fiche-conducteur/domain/ports/SyntheseDesResultatsRepository";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";

type FicheConducteurCradle = {
  ficheConducteurHandler: FicheConducteurHandler;
  recupererChantierFicheConducteurUseCase: RecupererChantierFicheConducteurUseCase;
  recupererAvancementUseCase: RecupererAvancementUseCase;
  recupererDerniereSyntheseDesResultatsUseCase: RecupererDerniereSyntheseDesResultatsUseCase;
  recupererDonneesCartographieUseCase: RecupererDonneesCartographieUseCase;
  recupererPublicationsUseCase: RecupererPublicationsUseCase;
  chantierRepository: ChantierRepository;
  indicateurRepository: IndicateurRepository;
  objectifRepository: ObjectifRepository;
  commentaireRepository: CommentaireRepository;
  synthèseDesRésultatsRepository: SyntheseDesResultatsRepository;
  decisionStrategiqueRepository: DecisionStrategiqueRepository;
};

export const ficheConducteurModule = defineModule<
  NoExports,
  FicheConducteurCradle
>()({
  name: "ficheConducteur",
  imports: ["framework"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      ficheConducteurHandler: asModuleClass(FicheConducteurHandler),
      recupererChantierFicheConducteurUseCase: asModuleClass(
        RecupererChantierFicheConducteurUseCase,
      ),
      recupererAvancementUseCase: asModuleClass(RecupererAvancementUseCase),
      recupererDerniereSyntheseDesResultatsUseCase: asModuleClass(
        RecupererDerniereSyntheseDesResultatsUseCase,
      ),
      recupererDonneesCartographieUseCase: asModuleClass(
        RecupererDonneesCartographieUseCase,
      ),
      recupererPublicationsUseCase: asModuleClass(RecupererPublicationsUseCase),
      chantierRepository: asModuleClass(PrismaChantierRepository),
      indicateurRepository: asModuleClass(PrismaIndicateurRepository),
      objectifRepository: asModuleClass(PrismaObjectifRepository),
      commentaireRepository: asModuleClass(PrismaCommentaireRepository),
      synthèseDesRésultatsRepository: asModuleClass(
        PrismaSyntheseDesResultatsRepository,
      ),
      decisionStrategiqueRepository: asModuleClass(
        PrismaDecisionStrategiqueRepository,
      ),
    } satisfies VerifyCradle<FicheConducteurCradle>);
  },
});

type Scope = ExtractScope<typeof ficheConducteurModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
