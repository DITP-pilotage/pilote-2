import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { Transaction } from "@/server/db/Transaction";
import type { Inject } from "@/server/parametrage-centre-aide/module";

export class DeplacerArticleCentreAideUseCase {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  private transaction: Transaction;

  constructor({
    articleCentreAideRepository,
    transaction,
  }: Inject<"articleCentreAideRepository" | "transaction">) {
    this.articleCentreAideRepository = articleCentreAideRepository;
    this.transaction = transaction;
  }

  async execute({
    id,
    parentId,
    index,
  }: {
    id: string;
    parentId: string | null;
    index: number;
  }) {
    const article = await this.articleCentreAideRepository.recupererParId(id);
    if (!article) throw new Error("Article introuvable");

    await this.verifierAbsenceDeCycle(id, parentId);

    const ancienParentId = article.parentId;
    const changeDeParent = ancienParentId !== parentId;

    const ancienneFratrie = (
      await this.articleCentreAideRepository.listerParParent(ancienParentId)
    ).filter((frere) => frere.id !== id);

    const nouvelleFratrie = changeDeParent
      ? (
          await this.articleCentreAideRepository.listerParParent(parentId)
        ).filter((frere) => frere.id !== id)
      : [...ancienneFratrie];

    const position = Math.max(0, Math.min(index, nouvelleFratrie.length));
    nouvelleFratrie.splice(position, 0, article);

    await this.transaction.run(async () => {
      for (const [ordre, frere] of nouvelleFratrie.entries()) {
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          frere.id,
          ordre,
          parentId,
        );
      }

      if (!changeDeParent) return;

      for (const [ordre, frere] of ancienneFratrie.entries()) {
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          frere.id,
          ordre,
          ancienParentId,
        );
      }
    });
  }

  private async verifierAbsenceDeCycle(
    id: string,
    parentId: string | null,
  ): Promise<void> {
    let ancetreId = parentId;
    while (ancetreId) {
      if (ancetreId === id) {
        throw new Error("Un article ne peut pas être déplacé sous lui-même");
      }
      const ancetre =
        await this.articleCentreAideRepository.recupererParId(ancetreId);
      ancetreId = ancetre?.parentId ?? null;
    }
  }
}
