import { Nouveaute } from "@/server/parametrage-nouveautes/domain/Nouveaute";

import { NouveauteRepository } from "@/server/parametrage-nouveautes/domain/ports/NouveauteRepository";
import type { Inject } from "@/server/parametrage-nouveautes/module";

export class ModifierNouveauteUseCase {
  private readonly nouveauteRepository: NouveauteRepository;

  constructor({ nouveauteRepository }: Inject<"nouveauteRepository">) {
    this.nouveauteRepository = nouveauteRepository;
  }

  async execute({
    id,
    contenu,
    version,
    date,
  }: {
    id: string;
    contenu: string;
    version: string;
    date: string;
  }) {
    const contenuSanitized = Nouveaute.sanitizeHtml(contenu);

    const verifiedVersion = Nouveaute.verifyVersion(version);

    const nouveaute = Nouveaute.creerNouveaute({
      id,
      contenu: contenuSanitized,
      version: verifiedVersion,
      date,
    });

    return this.nouveauteRepository.modifier(nouveaute);
  }
}
