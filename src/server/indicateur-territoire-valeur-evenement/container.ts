import { asClass, AwilixContainer } from "awilix";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaIndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/PrismaIndicateurTerritoireValeurEvenementRepository";
import { PrismaMesureIndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/PrismaMesureIndicateurRepository";
import { MesureIndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/MesureIndicateurRepository";
import { IndicateurTerritoireValeurEvenementRepository } from "./domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { CreerIndicateurTerritoireValeurEvenementUseCase } from "./usecases/CreerIndicateurTerritoireValeurEvenementUseCase";
import { AccepterPropositionValeurAvancementUseCase } from "./usecases/AccepterPropositionValeurAvancementUseCase";
import { RefuserPropositionValeurAvancementUseCase } from "./usecases/RefuserPropositionValeurAvancementUseCase";
import { ModifierPropositionValeurAvancementUseCase } from "./usecases/ModifierPropositionValeurAvancementUseCase";
import { SupprimerPropositionValeurAvancementUseCase } from "./usecases/SupprimerPropositionValeurAvancementUseCase";

export type IndicateurTerritoireValeurEvenementDependencies = {
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  mesureIndicateurRepository: MesureIndicateurRepository;
  creerIndicateurTerritoireValeurEvenementUseCase: CreerIndicateurTerritoireValeurEvenementUseCase;
  accepterPropositionValeurAvancementUseCase: AccepterPropositionValeurAvancementUseCase;
  refuserPropositionValeurAvancementUseCase: RefuserPropositionValeurAvancementUseCase;
  modifierPropositionValeurAvancementUseCase: ModifierPropositionValeurAvancementUseCase;
  supprimerPropositionValeurAvancementUseCase: SupprimerPropositionValeurAvancementUseCase;
};
export const getIndicateurTerritoireValeurEvenementContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<
  IndicateurTerritoireValeurEvenementDependencies & { prisma: PrismaPilote }
> => {
  return initialContainer
    .createScope<IndicateurTerritoireValeurEvenementDependencies>()
    .register({
      indicateurTerritoireValeurEvenementRepository: asClass(
        PrismaIndicateurTerritoireValeurEvenementRepository,
      ),
      mesureIndicateurRepository: asClass(PrismaMesureIndicateurRepository),
      creerIndicateurTerritoireValeurEvenementUseCase: asClass(
        CreerIndicateurTerritoireValeurEvenementUseCase,
      ),
      accepterPropositionValeurAvancementUseCase: asClass(
        AccepterPropositionValeurAvancementUseCase,
      ),
      refuserPropositionValeurAvancementUseCase: asClass(
        RefuserPropositionValeurAvancementUseCase,
      ),
      modifierPropositionValeurAvancementUseCase: asClass(
        ModifierPropositionValeurAvancementUseCase,
      ),
      supprimerPropositionValeurAvancementUseCase: asClass(
        SupprimerPropositionValeurAvancementUseCase,
      ),
    });
};
