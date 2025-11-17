import { SendSmtpEmail, TransactionalEmailsApi } from "@getbrevo/brevo";
import {
  EnvoieEmailService,
  ParametresEmailProposition,
  TypeEvenementAvecNotifications,
} from "@/server/indicateur-territoire-valeur-evenement/domain/ports/EnvoieEmailService";
import { configuration } from "@/config";

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(0, configuration().brevo.apiKey);

export class BrevoEnvoieEmailService implements EnvoieEmailService {
  async envoieNotificationProposition<
    T extends TypeEvenementAvecNotifications,
  >(args: {
    destinataires: { email: string }[];
    templateId: number;
    parametres: ParametresEmailProposition<T>;
  }) {
    let email = new SendSmtpEmail();
    email.to = args.destinataires;
    email.templateId = args.templateId;
    email.params = args.parametres;
    await apiInstance.sendTransacEmail(email);
  }
}
