import { asClass, AwilixContainer } from "awilix";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaIndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/PrismaIndicateurTerritoireValeurEvenementRepository";
import { IndicateurTerritoireValeurEvenementRepository } from "./domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { CreerIndicateurTerritoireValeurEvenementUseCase } from "./usecases/CreerIndicateurTerritoireValeurEvenementUseCase";

export type IndicateurTerritoireValeurEvenementDependencies = {
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  creerIndicateurTerritoireValeurEvenementUseCase: CreerIndicateurTerritoireValeurEvenementUseCase;
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
      creerIndicateurTerritoireValeurEvenementUseCase: asClass(
        CreerIndicateurTerritoireValeurEvenementUseCase,
      ),
    });
};
