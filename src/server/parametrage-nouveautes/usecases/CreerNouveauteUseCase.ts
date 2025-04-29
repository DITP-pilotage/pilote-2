import { NouveauteRepository } from '@/server/parametrage-nouveautes/domain/ports/NouveauteRepository';
import { Nouveaute } from '@/server/parametrage-nouveautes/domain/Nouveaute';

type Dependencies = {
  nouveauteRepository: NouveauteRepository;
};

export class CreerNouveauteUseCase {
  private nouveauteRepository: NouveauteRepository;
  
  constructor({ nouveauteRepository }: Dependencies) {
    this.nouveauteRepository = nouveauteRepository;
  }

  async execute({ contenu, version, date }: { contenu: string, version: string, date: string }) {
    const contenuSanitized = Nouveaute.sanitizeHtml(contenu);

    const verifiedVersion = Nouveaute.verifyVersion(version);

    const nouveaute = Nouveaute.creerNouveaute({ contenu: contenuSanitized, version: verifiedVersion, date });

    return this.nouveauteRepository.creerNouveaute(nouveaute);
  }
}
