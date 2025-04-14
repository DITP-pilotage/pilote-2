import { Nouveaute } from '@/server/parametrage-nouveautes/domain/Nouveaute';
import { NouveauteRepository } from '@/server/parametrage-nouveautes/domain/ports/NouveauteRepository';

type Dependencies = {
  nouveauteRepository: NouveauteRepository;
};

export class ListerNouveautesUseCase {
  private nouveauteRepository: NouveauteRepository;

  constructor({ nouveauteRepository }: Dependencies) {
    this.nouveauteRepository = nouveauteRepository;
  }

  async execute(): Promise<Nouveaute[]> {
    return this.nouveauteRepository.listerNouveautes();
  }
}
