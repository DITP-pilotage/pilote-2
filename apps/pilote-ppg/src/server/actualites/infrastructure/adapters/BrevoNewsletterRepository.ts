import { EmailCampaignsApi } from "@getbrevo/brevo";
import { configuration } from "@/config";
import { Newsletter } from "@/server/actualites/domain/Newsletter";
import { NewsletterRepository } from "@/server/actualites/domain/ports/NewsletterRepository";

const FILTRE_NOM_CAMPAGNE = "MINUTE PILOTE";

const estUneCampagneMinutePilote = (name: string | undefined): boolean =>
  (name ?? "").toUpperCase().includes(FILTRE_NOM_CAMPAGNE);

export class BrevoNewsletterRepository implements NewsletterRepository {
  private readonly emailCampaignsApi: EmailCampaignsApi;

  constructor() {
    this.emailCampaignsApi = new EmailCampaignsApi();
    this.emailCampaignsApi.setApiKey(0, configuration().brevo.apiKey);
    // Workaround: bug SDK Brevo — getEmailCampaign passe campaignId en `data` sur une requête GET,
    // ce qui fait planter Axios ("Data after transformation must be a string…")
    this.emailCampaignsApi.addInterceptor((requestOptions) => {
      if (requestOptions.method === "GET") {
        delete requestOptions.data;
      }
      return Promise.resolve();
    });
  }

  async listerNewsletters(): Promise<Newsletter[]> {
    const { body } = await this.emailCampaignsApi.getEmailCampaigns(
      undefined,
      "sent",
      undefined,
      undefined,
      undefined,
      50,
      undefined,
      "desc",
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
        dateEnvoi: new Date(campaign.sentDate!).toISOString(),
        lienArchive: campaign.shareLink!,
      }));
  }

  async recupererParId(id: number): Promise<Newsletter | null> {
    const { body } = await this.emailCampaignsApi.getEmailCampaign(id);

    if (
      !estUneCampagneMinutePilote(body.name) ||
      body.subject == null ||
      body.sentDate == null ||
      body.shareLink == null
    ) {
      return null;
    }

    return {
      id: body.id,
      sujet: body.subject,
      dateEnvoi: new Date(body.sentDate).toISOString(),
      lienArchive: body.shareLink,
    };
  }
}
