import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";

export interface ArticleCentreAideRepository {
  creer(article: ArticleCentreAide): Promise<void>;
  lister(): Promise<ArticleCentreAide[]>;
  recupererParId(id: string): Promise<ArticleCentreAide | null>;
  modifier(article: ArticleCentreAide): Promise<void>;
  supprimer(id: string): Promise<void>;
  listerParParent(parentId: string | null): Promise<ArticleCentreAide[]>;
  modifierOrdreEtParent(
    id: string,
    ordre: number,
    parentId: string | null,
  ): Promise<void>;
}
