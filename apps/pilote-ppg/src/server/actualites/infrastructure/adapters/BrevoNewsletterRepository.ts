import { EmailCampaignsApi } from "@getbrevo/brevo";
import { configuration } from "@/config";
import { Newsletter } from "@/server/actualites/domain/Newsletter";
import { NewsletterDetail } from "@/server/actualites/domain/NewsletterDetail";
import { NewsletterRepository } from "@/server/actualites/domain/ports/NewsletterRepository";

const FILTRE_NOM_CAMPAGNE = "MINUTE PILOTE";

const estUneCampagneMinutePilote = (name: string | undefined): boolean =>
  (name ?? "").toUpperCase().includes(FILTRE_NOM_CAMPAGNE);

export class BrevoNewsletterRepository implements NewsletterRepository {
  private readonly emailCampaignsApi: EmailCampaignsApi;

  constructor() {
    this.emailCampaignsApi = new EmailCampaignsApi();
    this.emailCampaignsApi.setApiKey(0, configuration().brevo.apiKey);
  }

  async listerNewsletters(): Promise<Newsletter[]> {
    const { body } = await this.emailCampaignsApi.getEmailCampaigns(
      undefined,
      "sent",
      undefined,
      undefined,
      undefined,
      50,
    );

    return (body.campaigns ?? [])
      .filter(
        (campaign) =>
          estUneCampagneMinutePilote(campaign.name) &&
          campaign.id != null &&
          campaign.subject != null &&
          campaign.sentDate != null &&
          campaign.shareLink != null,
      )
      .map((campaign) => ({
        id: campaign.id!,
        sujet: campaign.subject!,
        dateEnvoi: new Date(campaign.sentDate!),
        lienArchive: campaign.shareLink!,
      }));
  }

  async recupererParId(id: number): Promise<NewsletterDetail | null> {
    const response = await fetch(
      `https://api.brevo.com/v3/emailCampaigns/${id}`,
      {
        headers: {
          "api-key": configuration().brevo.apiKey,
          accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as {
      id?: number;
      name?: string;
      subject?: string;
      sentDate?: string;
      shareLink?: string;
      htmlContent?: string;
    };

    if (
      !estUneCampagneMinutePilote(body.name) ||
      body.id == null ||
      body.subject == null ||
      body.sentDate == null ||
      body.shareLink == null ||
      body.htmlContent == null
    ) {
      return null;
    }

    return {
      id: body.id,
      sujet: body.subject,
      dateEnvoi: new Date(body.sentDate),
      lienArchive: body.shareLink,
      htmlContent: body.htmlContent,
    };
  }
}
