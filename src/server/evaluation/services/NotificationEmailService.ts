import { EmailManager } from "@/server/infrastructure/email-manager";

export class NotificationEmailService {
  constructor(private readonly deps: { emailManager: EmailManager }) {}

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
    await this.deps.emailManager.sendTransactionalEmail(
      destinataires,
      templateId,
      params,
    );
  }
}
