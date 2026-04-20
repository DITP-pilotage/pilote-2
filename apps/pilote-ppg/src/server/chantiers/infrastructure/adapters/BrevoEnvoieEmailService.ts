import { EnvoieEmailService } from "@/server/chantiers/domain/ports/EnvoieEmailService";
import { EmailManager } from "@/server/infrastructure/email-manager";

export class BrevoEnvoieEmailService implements EnvoieEmailService {
  constructor(private readonly deps: { emailManager: EmailManager }) {}

  async envoieUnEmail(
    destinataires: { email: string }[],
    templateId: number,
    parametres: object,
  ): Promise<void> {
    await this.deps.emailManager.sendTransactionalEmail(
      destinataires,
      templateId,
      parametres,
    );
  }
}
