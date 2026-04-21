import { Newsletter } from "@/server/actualites/domain/Newsletter";

export interface NewsletterRepository {
  listerNewsletters(): Promise<Newsletter[]>;
}
