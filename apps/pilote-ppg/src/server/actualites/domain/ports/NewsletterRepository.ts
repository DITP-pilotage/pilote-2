import { Newsletter } from "@/server/actualites/domain/Newsletter";
import { NewsletterDetail } from "@/server/actualites/domain/NewsletterDetail";

export interface NewsletterRepository {
  listerNewsletters(): Promise<Newsletter[]>;
  recupererParId(id: number): Promise<NewsletterDetail | null>;
}
