import { mock, MockProxy } from 'jest-mock-extended';
import {
  ModifierPropositionValeurActuelleUseCase,
} from '@/server/chantiers/usecases/ModifierPropositionValeurActuelleUseCase';
import {
  PropositionValeurActuelleRepository,
} from '@/server/chantiers/domain/ports/PropositionValeurActuelleRepository';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';

describe('ModifierPropositionValeurActuelleUseCase', () => {
  let propositionValeurActuelleRepository: MockProxy<PropositionValeurActuelleRepository>;
  let indicateurRepository: MockProxy<IndicateurRepository>;
  let modifierPropositionValeurActuelleUseCase: ModifierPropositionValeurActuelleUseCase;

  beforeEach(() => {
    propositionValeurActuelleRepository = mock<PropositionValeurActuelleRepository>();
    indicateurRepository = mock<IndicateurRepository>();
    modifierPropositionValeurActuelleUseCase = new ModifierPropositionValeurActuelleUseCase({ propositionValeurActuelleRepository, indicateurRepository });
  });

  it('doit créer une nouvelle proposition de valeur actuelle', async () => {
    // Given
    let indicId = 'IND-001';
    let territoireCode = 'DEPT-01';
    let auteurModification = 'test@test.com';

    // When
    await modifierPropositionValeurActuelleUseCase.run({ indicId, territoireCode, auteurModification });
    // Then
    expect(propositionValeurActuelleRepository.supprimerPropositionValeurActuelle).toHaveBeenCalledTimes(1);
    expect(indicateurRepository.supprimerPropositionValeurActuelle).toHaveBeenCalledTimes(1);
  });
});
