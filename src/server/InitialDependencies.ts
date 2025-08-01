import { AwilixContainer } from "awilix";
import { asClass } from "awilix";
import { PrismaPilote } from "./db/PrismaPilote";
import { Transaction } from "./db/Transaction";
import { PrismaIndicateurTerritoireValeurEvenementRepository } from "./indicateur-territoire-valeur-evenement/infrastructure/PrismaIndicateurTerritoireValeurEvenementRepository";
import { IndicateurTerritoireValeurEvenementRepository } from "./indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { getInitialContainer } from "./initial-container";

export type InitialDependencies = {
  prisma: PrismaPilote;
  transaction: Transaction;
} & TransversalDependencies;

export interface TransversalDependencies {
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
}

export function getInitialContainerWithTransversalDependencies(): AwilixContainer<InitialDependencies> {
  const initialContainer = getInitialContainer();
  
  return initialContainer.register({
    indicateurTerritoireValeurEvenementRepository: asClass(
      PrismaIndicateurTerritoireValeurEvenementRepository,
    ),
  });
}
