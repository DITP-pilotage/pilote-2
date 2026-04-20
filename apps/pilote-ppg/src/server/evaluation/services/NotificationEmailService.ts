import { EmailManager } from "@/server/infrastructure/email-manager";
import type { Inject } from "@/server/evaluation/module";

export class NotificationEmailService {
  private readonly emailManager: EmailManager;

  constructor({ emailManager }: Inject<"emailManager">) {
    this.emailManager = emailManager;
  }

  async execute({
    destinataires,
    templateId,
    params,
  }: {
    destinataires: { email: string }[];
    templateId: number;
    params: {
      listeTerritoires: string[];
    };
  }) {
    await this.emailManager.sendTransactionalEmail(
      destinataires,
      templateId,
      params,
    );
  }
}
