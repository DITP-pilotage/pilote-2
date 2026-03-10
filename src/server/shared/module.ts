import { asClass, Lifetime } from "awilix";
import { DatajobsExecutionQueries } from "@/server/datajobs-execution/DatajobsExecution";
import {
  BrevoEmailManager,
  type EmailManager,
  StubEmailManager,
} from "@/server/infrastructure/email-manager";
import { configuration } from "@/config";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { type Transaction } from "@/server/db/Transaction";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { PrismaIndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/PrismaIndicateurTerritoireValeurEvenementRepository";
import type { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { defineModule } from "@/server/module-system";

type SharedExports = Record<string, never>;

type SharedCradle = SharedExports & {
  prisma: PrismaPilote;
  transaction: Transaction;
  emailManager: EmailManager;
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  datajobsExecutionQueries: DatajobsExecutionQueries;
};

export type SharedDependencies = SharedCradle;

export const sharedModule = defineModule<"shared", SharedExports, SharedCradle>(
  {
    name: "shared",
    imports: [],
    exports: [],
    register: (container, fn) => {
      container.register({
        prisma: asClass(PrismaPilote, { lifetime: Lifetime.SINGLETON }),
        transaction: asClass(PrismaTransaction, {
          lifetime: Lifetime.SINGLETON,
        }),
        emailManager: fn(() =>
          configuration().brevo.disableEmails
            ? new StubEmailManager()
            : new BrevoEmailManager(),
        ).singleton(),
        indicateurTerritoireValeurEvenementRepository: asClass(
          PrismaIndicateurTerritoireValeurEvenementRepository,
        ),
        datajobsExecutionQueries: asClass(DatajobsExecutionQueries),
      });
    },
  },
);
