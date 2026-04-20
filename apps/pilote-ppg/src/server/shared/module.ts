import {
  BrevoEmailManager,
  type EmailManager,
  StubEmailManager,
} from "@/server/infrastructure/email-manager";
import { configuration } from "@/config";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { type Transaction } from "@/server/db/Transaction";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import {
  defineModule,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";

type SharedCradle = {
  prisma: PrismaPilote;
  transaction: Transaction;
  emailManager: EmailManager;
};

export type SharedDependencies = SharedCradle;

export const sharedModule = defineModule<NoExports, SharedCradle>()({
  name: "shared",
  imports: [],
  exports: [],
  register: (container, { asModuleFunction }) => {
    container.register({
      prisma: asModuleFunction(() => new PrismaPilote()).singleton(),
      transaction: asModuleFunction(() => new PrismaTransaction()).singleton(),
      emailManager: asModuleFunction(() =>
        configuration().brevo.disableEmails
          ? new StubEmailManager()
          : new BrevoEmailManager(),
      ).singleton(),
    } satisfies VerifyCradle<SharedCradle>);
  },
});
