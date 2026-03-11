import { asClass, Lifetime } from "awilix";
import {
  BrevoEmailManager,
  type EmailManager,
  StubEmailManager,
} from "@/server/infrastructure/email-manager";
import { configuration } from "@/config";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { type Transaction } from "@/server/db/Transaction";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { defineModule } from "@/server/module-system";

type SharedExports = Record<string, never>;

type SharedCradle = SharedExports & {
  prisma: PrismaPilote;
  transaction: Transaction;
  emailManager: EmailManager;
};

export type SharedDependencies = SharedCradle;

export const sharedModule = defineModule<SharedExports, SharedCradle>()({
  name: "shared",
  imports: [],
  exports: [],
  register: (container, { asModuleFunction }) => {
    container.register({
      prisma: asClass(PrismaPilote, { lifetime: Lifetime.SINGLETON }),
      transaction: asClass(PrismaTransaction, {
        lifetime: Lifetime.SINGLETON,
      }),
      emailManager: asModuleFunction(() =>
        configuration().brevo.disableEmails
          ? new StubEmailManager()
          : new BrevoEmailManager(),
      ).singleton(),
    });
  },
});
