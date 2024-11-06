import {
  PropositionValeurActuelleRepository,
} from '@/server/chantiers/domain/ports/PropositionValeurActuelleRepository';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';

interface Dependencies {
  propositionValeurActuelleRepository: PropositionValeurActuelleRepository
  indicateurRepository: IndicateurRepository
}

export class ModifierPropositionValeurActuelleUseCase {
  private propositionValeurActuelleRepository: PropositionValeurActuelleRepository;

  private indicateurRepository: IndicateurRepository;

  constructor({ propositionValeurActuelleRepository, indicateurRepository }: Dependencies) {
    this.propositionValeurActuelleRepository = propositionValeurActuelleRepository;
    this.indicateurRepository = indicateurRepository;
  }

  async run({
    indicId,
    territoireCode,
    auteurModification,
  }: {
    indicId: string,
    territoireCode: string,
    auteurModification: string,
  }) {
    await this.indicateurRepository.supprimerPropositionValeurActuelle({
      indicId,
      territoireCode,
      auteurModification,
    });

    await this.propositionValeurActuelleRepository.supprimerPropositionValeurActuelle({
      indicId,
      territoireCode,
    });
  }
}

