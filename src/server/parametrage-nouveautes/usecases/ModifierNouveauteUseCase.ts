import { Nouveaute } from "../domain/Nouveaute";
import { NouveauteRepository } from "../domain/ports/NouveauteRepository";

type Dependencies = {
  nouveauteRepository: NouveauteRepository;
};

export class ModifierNouveauteUseCase {
  private readonly nouveauteRepository: NouveauteRepository;

  constructor({ nouveauteRepository }: Dependencies) {
    this.nouveauteRepository = nouveauteRepository;
  }

  async execute({ id, contenu, version, date }: { id: string, contenu: string, version: string, date: string }) {
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
