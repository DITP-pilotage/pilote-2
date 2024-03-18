import { mock, MockProxy } from 'jest-mock-extended';
import { ChantierBuilder } from '@/server/fiche-conducteur/app/builders/ChantierBuilder';
import { ChantierRepository } from '@/server/fiche-conducteur/domain/ports/ChantierRepository';
import {
  RécupererChantierFicheConducteurUseCase,
} from '@/server/fiche-conducteur/usecases/RécupererChantierFicheConducteurUseCase';
import { IndicateurBuilder } from '@/server/fiche-conducteur/app/builders/IndicateurBuilder';
import { IndicateurRepository } from '@/server/fiche-conducteur/domain/ports/IndicateurRepository';

describe('RécupererChantierFicheConducteurUseCase', () => {
  let chantierRepository: MockProxy<ChantierRepository>;
  let indicateurRepository: MockProxy<IndicateurRepository>;
  let récupererChantierFicheConducteurUseCase: RécupererChantierFicheConducteurUseCase;

  beforeEach(() => {
    chantierRepository = mock<ChantierRepository>();
    indicateurRepository = mock<IndicateurRepository>();
    récupererChantierFicheConducteurUseCase = new RécupererChantierFicheConducteurUseCase({
      chantierRepository,
      indicateurRepository,
    });
  });

  it('doit récupérer le chantier associé au code', async () => {
    // Given
    const id = 'CH-168';
    const territoireCode = 'NAT-FR';
    const chantier = new ChantierBuilder()
      .withId('CH-168')
      .withNom('Chantier 1')
      .withListeDirecteursAdministrationCentrale('DAC 1', 'DAC 2')
      .withListeDirecteursProjet('DP 1', 'DP 2')
      .withNom('Chantier 1')
      .build();
    chantierRepository.récupérerParIdEtParTerritoireCode.mockResolvedValue( chantier);
    indicateurRepository.récupérerIndicImpactParChantierId.mockResolvedValue([]);
    // When
    const chantierResult = await récupererChantierFicheConducteurUseCase.run({ chantierId: id, territoireCode });
    // Then
    expect(chantierRepository.récupérerParIdEtParTerritoireCode).toHaveBeenNthCalledWith(1, { chantierId: 'CH-168', territoireCode: 'NAT-FR' });
    expect(chantierResult.id).toEqual('CH-168');
    expect(chantierResult.nom).toEqual('Chantier 1');
    expect(chantierResult.listeDirecteursAdministrationCentrale).toIncludeSameMembers(['DAC 1', 'DAC 2']);
    expect(chantierResult.listeDirecteursProjet).toIncludeSameMembers(['DP 1', 'DP 2']);
  });

  it('doit récupérer les indicateurs associé au chantier', async () => {
    // Given
    const id = 'CH-168';
    const territoireCode = 'NAT-FR';
    const chantier = new ChantierBuilder()
      .withId('CH-168')
      .withNom('Chantier 1')
      .withListeDirecteursAdministrationCentrale('DAC 1', 'DAC 2')
      .withListeDirecteursProjet('DP 1', 'DP 2')
      .withNom('Chantier 1')
      .build();
    chantierRepository.récupérerParIdEtParTerritoireCode.mockResolvedValue( chantier);

    const indicateur1 = new IndicateurBuilder().withNom('Indicateur 1').withType('IMPACT').build();
    const indicateur2 = new IndicateurBuilder().withNom('Indicateur 2').withType('IMPACT').build();
    const indicateur3 = new IndicateurBuilder().withNom('Indicateur 3').withType('Q_SERV').build();
    indicateurRepository.récupérerIndicImpactParChantierId.mockResolvedValue([indicateur1, indicateur2, indicateur3]);
    // When
    const chantierResult = await récupererChantierFicheConducteurUseCase.run({ chantierId: id, territoireCode });
    // Then
    expect(indicateurRepository.récupérerIndicImpactParChantierId).toHaveBeenNthCalledWith(1, 'CH-168');
    expect(chantierResult.indicateurs).toHaveLength(3);
    expect(chantierResult.indicateurs.map(indic => indic.nom)).toIncludeSameMembers(['Indicateur 1', 'Indicateur 2', 'Indicateur 3']);
    expect(chantierResult.indicateurs.map(indic => indic.type)).toIncludeSameMembers(['IMPACT', 'IMPACT', 'Q_SERV']);
  });
});
