import { asClass } from "awilix";
import { FicheConducteurHandler } from "@/server/fiche-conducteur/infrastructure/handlers/FicheConducteurHandler";
import { ChantierRepository } from "@/server/fiche-conducteur/domain/ports/ChantierRepository";
import { PrismaChantierRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaChantierRepository";
import { IndicateurRepository } from "@/server/fiche-conducteur/domain/ports/IndicateurRepository";
import { PrismaIndicateurRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaIndicateurRepository";
import { RécupererChantierFicheConducteurUseCase } from "@/server/fiche-conducteur/usecases/RécupererChantierFicheConducteurUseCase";
import { ObjectifRepository } from "@/server/fiche-conducteur/domain/ports/ObjectifRepository";
import { PrismaObjectifRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaObjectifRepository";
import { PrismaCommentaireRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaCommentaireRepository";
import { PrismaDecisionStrategiqueRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaDecisionStrategiqueRepository";
import { CommentaireRepository } from "@/server/fiche-conducteur/domain/ports/CommentaireRepository";
import { DecisionStrategiqueRepository } from "@/server/fiche-conducteur/domain/ports/DecisionStrategiqueRepository";
import { RécupérerPublicationsUseCase } from "@/server/fiche-conducteur/usecases/RécupérerPublicationsUseCase";
import { RécupérerAvancementUseCase } from "@/server/fiche-conducteur/usecases/RécupérerAvancementUseCase";
import { RécupérerDernièreSynthèseDesRésultatsUseCase } from "@/server/fiche-conducteur/usecases/RécupérerDernièreSynthèseDesRésultatsUseCase";
import { RécupérerDonnéesCartographieUseCase } from "@/server/fiche-conducteur/usecases/RécupérerDonnéesCartographieUseCase";
import { PrismaSynthèseDesRésultatsRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaSynthèseDesRésultatsRepository";
import { SynthèseDesRésultatsRepository } from "@/server/fiche-conducteur/domain/ports/SynthèseDesRésultatsRepository";
import { defineModule } from "@/server/module-system";

type FicheConducteurExports = Record<string, never>;

type FicheConducteurCradle = FicheConducteurExports & {
  ficheConducteurHandler: FicheConducteurHandler;
  recupererChantierFicheConducteurUseCase: RécupererChantierFicheConducteurUseCase;
  recupererAvancementUseCase: RécupérerAvancementUseCase;
  recupererDerniereSyntheseDesResultatsUseCase: RécupérerDernièreSynthèseDesRésultatsUseCase;
  recupererDonneesCartographieUseCase: RécupérerDonnéesCartographieUseCase;
  recupererPublicationsUseCase: RécupérerPublicationsUseCase;
  chantierRepository: ChantierRepository;
  indicateurRepository: IndicateurRepository;
  objectifRepository: ObjectifRepository;
  commentaireRepository: CommentaireRepository;
  synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
  decisionStrategiqueRepository: DecisionStrategiqueRepository;
};

export type FicheConducteurDependencies = FicheConducteurCradle;

export const ficheConducteurModule = defineModule<
  "ficheConducteur",
  FicheConducteurExports,
  FicheConducteurCradle
>({
  name: "ficheConducteur",
  imports: ["shared"],
  exports: [],
  register: (container) => {
    container.register({
      ficheConducteurHandler: asClass(FicheConducteurHandler),
      recupererChantierFicheConducteurUseCase: asClass(
        RécupererChantierFicheConducteurUseCase,
      ),
      recupererAvancementUseCase: asClass(RécupérerAvancementUseCase),
      recupererDerniereSyntheseDesResultatsUseCase: asClass(
        RécupérerDernièreSynthèseDesRésultatsUseCase,
      ),
      recupererDonneesCartographieUseCase: asClass(
        RécupérerDonnéesCartographieUseCase,
      ),
      recupererPublicationsUseCase: asClass(RécupérerPublicationsUseCase),
      chantierRepository: asClass(PrismaChantierRepository),
      indicateurRepository: asClass(PrismaIndicateurRepository),
      objectifRepository: asClass(PrismaObjectifRepository),
      commentaireRepository: asClass(PrismaCommentaireRepository),
      synthèseDesRésultatsRepository: asClass(
        PrismaSynthèseDesRésultatsRepository,
      ),
      decisionStrategiqueRepository: asClass(
        PrismaDecisionStrategiqueRepository,
      ),
    });
  },
});
