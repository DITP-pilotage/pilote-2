import { Newsletter } from "@/server/actualites/domain/Newsletter";
import { NewsletterDetail } from "@/server/actualites/domain/NewsletterDetail";

export type NewsletterContrat = {
  id: number;
  sujet: string;
  dateEnvoi: string;
  lienArchive: string;
};

export type NewsletterDetailContrat = NewsletterContrat & {
  htmlContent: string;
};

export const presenterEnNewsletterContrat = (
  newsletter: Newsletter,
): NewsletterContrat => ({
  id: newsletter.id,
  sujet: newsletter.sujet,
  dateEnvoi: newsletter.dateEnvoi.toISOString(),
  lienArchive: newsletter.lienArchive,
});

export const presenterEnListeNewsletterContrat = (
  newsletters: Newsletter[],
): NewsletterContrat[] => newsletters.map(presenterEnNewsletterContrat);

export const presenterEnNewsletterDetailContrat = (
  newsletter: NewsletterDetail,
): NewsletterDetailContrat => ({
  ...presenterEnNewsletterContrat(newsletter),
  htmlContent: newsletter.htmlContent,
});
