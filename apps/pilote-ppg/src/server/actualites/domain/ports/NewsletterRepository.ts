import { Newsletter } from "@/server/actualites/domain/Newsletter";

export interface NewsletterRepository {
  listerNewsletters(): Promise<Newsletter[]>;
  recupererParId(id: number): Promise<Newsletter | null>;
}
