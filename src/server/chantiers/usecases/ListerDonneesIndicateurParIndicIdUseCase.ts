import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';
import { DonneeIndicateur } from '@/server/chantiers/domain/DonneeIndicateur';

interface Dependencies {
  indicateurRepository: IndicateurRepository
}

export class ListerDonneesIndicateurParIndicIdUseCase {
  private indicateurRepository: IndicateurRepository;

  constructor({ indicateurRepository }: Dependencies) {
    this.indicateurRepository = indicateurRepository;
  }

  async run({ indicId }: { indicId: string }): Promise<DonneeIndicateur[]> {
    return this.indicateurRepository.listerParIndicId({ indicId });
  }
}
