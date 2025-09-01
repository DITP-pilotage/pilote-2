import { AwilixContainer, asClass } from "awilix";
import { DatajobsExecutionQueries } from "@/server/datajobs-execution/DatajobsExecution";
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
  datajobsExecutionQueries: DatajobsExecutionQueries;
}

export function getInitialContainerWithTransversalDependencies(): AwilixContainer<InitialDependencies> {
  const initialContainer = getInitialContainer();

  return initialContainer.register({
    indicateurTerritoireValeurEvenementRepository: asClass(
      PrismaIndicateurTerritoireValeurEvenementRepository,
    ),
    datajobsExecutionQueries: asClass(DatajobsExecutionQueries),
  });
}
