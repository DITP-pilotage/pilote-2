import { NewsletterDetail } from "@/server/actualites/domain/NewsletterDetail";
import { NewsletterRepository } from "@/server/actualites/domain/ports/NewsletterRepository";
import { Inject } from "@/server/actualites/module";

export class RecupererNewsletterUseCase {
  private readonly newsletterRepository: NewsletterRepository;

  constructor({ newsletterRepository }: Inject<"newsletterRepository">) {
    this.newsletterRepository = newsletterRepository;
  }

  async execute({ id }: { id: number }): Promise<NewsletterDetail> {
    const newsletter = await this.newsletterRepository.recupererParId(id);

    if (!newsletter) {
      throw new Error(`Newsletter ${id} non trouvée`);
    }

    return newsletter;
  }
}
