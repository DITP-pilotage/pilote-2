import { Newsletter } from "@/server/actualites/domain/Newsletter";
import { NewsletterRepository } from "@/server/actualites/domain/ports/NewsletterRepository";
import { Inject } from "@/server/actualites/module";

export class ListerNewslettersUseCase {
  private readonly newsletterRepository: NewsletterRepository;

  constructor({ newsletterRepository }: Inject<"newsletterRepository">) {
    this.newsletterRepository = newsletterRepository;
  }

  async execute(): Promise<Newsletter[]> {
    const newsletters = await this.newsletterRepository.listerNewsletters();
    return newsletters.sort(
      (a, b) => b.dateEnvoi.getTime() - a.dateEnvoi.getTime(),
    );
  }
}
