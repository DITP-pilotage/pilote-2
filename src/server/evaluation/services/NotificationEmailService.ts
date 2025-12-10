import { SendSmtpEmail, TransactionalEmailsApi } from "@getbrevo/brevo";
import { configuration } from "@/config";

export class NotificationEmailService {
  private readonly apiInstance: TransactionalEmailsApi;

  constructor() {
    this.apiInstance = new TransactionalEmailsApi();
    this.apiInstance.setApiKey(0, configuration().brevo.apiKey);
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
    let email = new SendSmtpEmail();
    email.to = destinataires;
    email.templateId = templateId;
    email.params = params;
    await this.apiInstance.sendTransacEmail(email);
  }
}
