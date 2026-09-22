import { BrevoClient } from "@getbrevo/brevo";
import { configuration } from "@/config";
import { Newsletter } from "@/server/actualites/domain/Newsletter";
import { NewsletterRepository } from "@/server/actualites/domain/ports/NewsletterRepository";

const FILTRE_NOM_CAMPAGNE = "MINUTE PILOTE";

const estUneCampagneMinutePilote = (name: string | undefined): boolean =>
  (name ?? "").toUpperCase().includes(FILTRE_NOM_CAMPAGNE);

export class BrevoNewsletterRepository implements NewsletterRepository {
  private readonly brevo: BrevoClient;

  constructor() {
    this.brevo = new BrevoClient({ apiKey: configuration().brevo.apiKey });
  }

  async listerNewsletters(): Promise<Newsletter[]> {
    const { campaigns } = await this.brevo.emailCampaigns.getEmailCampaigns({
      status: "sent",
      limit: 50,
      sort: "desc",
    });

    return (campaigns ?? [])
      .filter(
        (campaign) =>
          estUneCampagneMinutePilote(campaign.name) &&
          campaign.subject != null &&
          campaign.sentDate != null &&
          campaign.shareLink != null,
      )
      .map((campaign) => ({
        id: campaign.id,
        sujet: campaign.subject!,
        dateEnvoi: new Date(campaign.sentDate!).toISOString(),
        lienArchive: campaign.shareLink!,
      }));
  }

  async recupererParId(id: number): Promise<Newsletter | null> {
    const campagne = await this.brevo.emailCampaigns.getEmailCampaign({
      campaignId: id,
    });

    if (
      !estUneCampagneMinutePilote(campagne.name) ||
      campagne.subject == null ||
      campagne.sentDate == null ||
      campagne.shareLink == null
    ) {
      return null;
    }

    return {
      id: campagne.id,
      sujet: campagne.subject,
      dateEnvoi: new Date(campagne.sentDate).toISOString(),
      lienArchive: campagne.shareLink,
    };
  }
}
