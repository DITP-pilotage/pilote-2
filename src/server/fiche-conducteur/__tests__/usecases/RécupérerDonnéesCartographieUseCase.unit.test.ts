import { mock, MockProxy } from 'jest-mock-extended';
import { ChantierBuilder } from '@/server/fiche-conducteur/app/builders/ChantierBuilder';
import { ChantierRepository } from '@/server/fiche-conducteur/domain/ports/ChantierRepository';
import {
  RécupérerDonnéesCartographieUseCase,
} from '@/server/fiche-conducteur/usecases/RécupérerDonnéesCartographieUseCase';

describe('RécupérerDonnéesCartographieUseCase', () => {
  let récupérerDonnéesCartographieUseCase: RécupérerDonnéesCartographieUseCase;
  let chantierRepository: MockProxy<ChantierRepository>;

  beforeEach(() => {
    chantierRepository = mock<ChantierRepository>();
    récupérerDonnéesCartographieUseCase = new RécupérerDonnéesCartographieUseCase({ chantierRepository });
  });

  it('doit récupérer les données des cartographies de la fiche conducteur', async () => {
    // Given
    const chantierId = 'CH-168';
    const chantier1 = new ChantierBuilder().withId('CH-168').withCodeInsee('87').withMeteo('SOLEIL').withTauxAvancement(90.3).withMaille('DEPT').build();
    const chantier2 = new ChantierBuilder().withId('CH-168').withCodeInsee('36').withMeteo('COUVERT').withTauxAvancement(15.2).withMaille('DEPT').build();
    const chantier3 = new ChantierBuilder().withId('CH-168').withCodeInsee('FR').withMeteo('COUVERT').withTauxAvancement(17.2).withMaille('NAT').build();
    chantierRepository.récupérerMailleNatEtDeptParId.mockResolvedValue([chantier1, chantier2, chantier3]);

    // When
    const donnéesCartographieResult = await récupérerDonnéesCartographieUseCase.run({ chantierId });
    // Then
    expect(donnéesCartographieResult.map(donnee => donnee.codeInsee)).toIncludeSameMembers(['87', '36']);
    expect(donnéesCartographieResult.map(donnee => donnee.météo)).toIncludeSameMembers(['SOLEIL', 'COUVERT']);
    expect(donnéesCartographieResult.map(donnee => donnee.tauxAvancement)).toIncludeSameMembers([90.3, 15.2]);
  });
});
