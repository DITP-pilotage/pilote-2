import {
  PropositionValeurAvancementRepository,
} from '@/server/chantiers/domain/ports/PropositionValeurAvancementRepository';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';

interface Dependencies {
  propositionValeurAvancementRepository: PropositionValeurAvancementRepository
  indicateurRepository: IndicateurRepository
}

export class ModifierPropositionValeurAvancementUseCase {
  private propositionValeurAvancementRepository: PropositionValeurAvancementRepository;

  private indicateurRepository: IndicateurRepository;

  constructor({ propositionValeurAvancementRepository, indicateurRepository }: Dependencies) {
    this.propositionValeurAvancementRepository = propositionValeurAvancementRepository;
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
    await this.indicateurRepository.supprimerPropositionValeurAvancement({
      indicId,
      territoireCode,
      auteurModification,
    });

    await this.propositionValeurAvancementRepository.supprimerPropositionValeurAvancement({
      indicId,
      territoireCode,
    });
  }
}

