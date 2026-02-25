import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";

export interface ArticleCentreAideRepository {
  creer(article: ArticleCentreAide): Promise<void>;
  lister(): Promise<ArticleCentreAide[]>;
  modifier(article: ArticleCentreAide): Promise<void>;
  supprimer(id: string): Promise<void>;
}
