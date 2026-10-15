import {
  AlbertAccessRepository,
  UtilisateurSearchResult,
} from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import type { Inject } from "@/server/albert-access/module";

const LONGUEUR_MIN_RECHERCHE = 3;
const LIMITE_RESULTATS = 10;

export class SearchUtilisateursUseCase {
  private albertAccessRepository: AlbertAccessRepository;

  constructor({ albertAccessRepository }: Inject<"albertAccessRepository">) {
    this.albertAccessRepository = albertAccessRepository;
  }

  async execute({
    email,
  }: {
    email: string;
  }): Promise<UtilisateurSearchResult[]> {
    const recherche = email.trim();
    if (recherche.length < LONGUEUR_MIN_RECHERCHE) {
      return [];
    }
    return this.albertAccessRepository.searchUtilisateurs(
      recherche,
      LIMITE_RESULTATS,
    );
  }
}
