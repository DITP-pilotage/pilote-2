import { Newsletter } from "@/server/actualites/domain/Newsletter";

export type NewsletterContrat = {
  id: number;
  sujet: string;
  dateEnvoi: string;
  lienArchive: string;
};

const presenterEnNewsletterContrat = (newsletter: Newsletter): NewsletterContrat => ({
  id: newsletter.id,
  sujet: newsletter.sujet,
  dateEnvoi: newsletter.dateEnvoi.toISOString(),
  lienArchive: newsletter.lienArchive,
});

export const presenterEnListeNewsletterContrat = (
  newsletters: Newsletter[],
): NewsletterContrat[] => newsletters.map(presenterEnNewsletterContrat);
