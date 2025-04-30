import { SendSmtpEmail, TransactionalEmailsApi } from '@getbrevo/brevo';
import { EnvoieEmailService } from '@/server/chantiers/domain/ports/EnvoieEmailService';

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(0, process.env.BREVO_API_KEY ?? '');

export class BrevoEnvoieEmailService implements EnvoieEmailService {
  async envoieUnEmail(destinataires: { email: string; }[], templateId: number, parametres: object): Promise<void> {
    let email = new SendSmtpEmail();
    email.to = destinataires;
    email.templateId = templateId;
    email.params = parametres;
    apiInstance.sendTransacEmail(email);
  }
}
