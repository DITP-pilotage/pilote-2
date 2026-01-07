import {
  EnvoieEmailService,
  ParametresEmailProposition,
  TypeEvenementAvecNotifications,
} from "@/server/indicateur-territoire-valeur-evenement/domain/ports/EnvoieEmailService";
import { EmailManager } from "@/server/infrastructure/email-manager";

export class BrevoEnvoieEmailService implements EnvoieEmailService {
  constructor(private readonly deps: { emailManager: EmailManager }) {}

  async envoieNotificationProposition<
    T extends TypeEvenementAvecNotifications,
  >(args: {
    destinataires: { email: string }[];
    templateId: number;
    parametres: ParametresEmailProposition<T>;
  }) {
    await this.deps.emailManager.sendTransactionalEmail(
      args.destinataires,
      args.templateId,
      args.parametres,
    );
  }
}
