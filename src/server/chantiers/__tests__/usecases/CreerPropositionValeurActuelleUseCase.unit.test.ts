import { captor, mock, MockProxy } from 'jest-mock-extended';
import {
  CreerPropositionValeurActuelleUseCase,
} from '@/server/chantiers/usecases/CreerPropositionValeurActuelleUseCase';
import {
  PropositionValeurActuelleRepository,
} from '@/server/chantiers/domain/ports/PropositionValeurActuelleRepository';
import { PropositionValeurActuelle } from '@/server/chantiers/domain/PropositionValeurActuelle';
import { StatutProposition } from '@/server/chantiers/domain/StatutProposition';

describe('CreerPropositionValeurActuelleUseCase', () => {
  let propositionValeurActuelleRepository: MockProxy<PropositionValeurActuelleRepository>;
  let creerPropositionValeurActuelleUseCase: CreerPropositionValeurActuelleUseCase;

  beforeEach(() => {
    propositionValeurActuelleRepository = mock<PropositionValeurActuelleRepository>();
    creerPropositionValeurActuelleUseCase = new CreerPropositionValeurActuelleUseCase({ propositionValeurActuelleRepository });
  });

  it('doit créer une nouvelle proposition de valeur actuelle', async () => {
    // Given
    let indicId = 'IND-001';
    let valeurActuelleProposee = 12.3;
    let territoireCode = 'DEPT-01';
    let dateValeurActuelle = new Date('2023-01-17');
    let idAuteurModification = '642cfa5a-9438-4c77-8626-6cc9e63d1f92';
    let auteurModification = 'test@test.com';
    let dateProposition = new Date('2023-01-20');
    let motifProposition = 'Un motif';
    let sourceDonneeEtMethodeCalcul = 'une source de donnee et une methode';
    let statut = StatutProposition.EN_COURS;

    // When
    await creerPropositionValeurActuelleUseCase.run({ indicId, valeurActuelleProposee, territoireCode, dateValeurActuelle, idAuteurModification, auteurModification, dateProposition, motifProposition, sourceDonneeEtMethodeCalcul, statut });
    // Then
    const propositionValeurActuelleCaptor = captor<PropositionValeurActuelle>();
    expect(propositionValeurActuelleRepository.creerPropositionValeurActuelle).toHaveBeenNthCalledWith(1, propositionValeurActuelleCaptor);
  });
});
