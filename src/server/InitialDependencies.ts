import { AwilixContainer, asClass, asFunction } from "awilix";
import { DatajobsExecutionQueries } from "@/server/datajobs-execution/DatajobsExecution";
import {
  EmailManager,
  BrevoEmailManager,
  StubEmailManager,
} from "@/server/infrastructure/email-manager";
import { configuration } from "@/config";
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
  emailManager: EmailManager;
}

export function getInitialContainerWithTransversalDependencies(): AwilixContainer<InitialDependencies> {
  const initialContainer = getInitialContainer();

  return initialContainer.register({
    indicateurTerritoireValeurEvenementRepository: asClass(
      PrismaIndicateurTerritoireValeurEvenementRepository,
    ),
    datajobsExecutionQueries: asClass(DatajobsExecutionQueries),
    emailManager: asFunction(() =>
      configuration().brevo.disableEmails
        ? new StubEmailManager()
        : new BrevoEmailManager(),
    ).singleton(),
  });
}
