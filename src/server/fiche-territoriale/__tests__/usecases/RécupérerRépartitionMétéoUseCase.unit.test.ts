import { mock, MockProxy } from 'jest-mock-extended';
import { ChantierRepository } from '@/server/fiche-territoriale/domain/ports/ChantierRepository';
import { TerritoireRepository } from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import { TerritoireBuilder } from '@/server/fiche-territoriale/app/builders/TerritoireBuilder';
import { ChantierBuilder } from '@/server/fiche-territoriale/app/builders/ChantierBuilder';
import { RécupérerRépartitionMétéoUseCase } from '@/server/fiche-territoriale/usecases/RécupérerRépartitionMétéoUseCase';

describe('RécupérerRépartitionMétéoUseCase', () => {
  let récupérerRépartitionMétéoUseCase: RécupérerRépartitionMétéoUseCase;
  let chantierRepository: MockProxy<ChantierRepository>;
  let territoireRepository: MockProxy<TerritoireRepository>;

  beforeEach(() => {
    chantierRepository = mock<ChantierRepository>();
    territoireRepository = mock<TerritoireRepository>();
    récupérerRépartitionMétéoUseCase = new RécupérerRépartitionMétéoUseCase({ chantierRepository, territoireRepository });
  });

  it('quand le territoire est un departement, doit récupérer la répartition des météos pour un territoire donnée', async () => {
    // Given
    const territoireCode = 'DEPT-34';
    const territoire = new TerritoireBuilder().withMaille('DEPT').build();
    
    territoireRepository.recupererTerritoireParCode.mockResolvedValue(territoire);

    const chantier1 = new ChantierBuilder().withMeteo('ORAGE').build();
    const chantier2 = new ChantierBuilder().withMeteo('ORAGE').build();
    const chantier3 = new ChantierBuilder().withMeteo('COUVERT').build();
    const chantier4 = new ChantierBuilder().withMeteo('SOLEIL').build();

    chantierRepository.listerParTerritoireCodePourEtMaille.mockResolvedValue([chantier1, chantier2, chantier3, chantier4]);

    // When
    const result = await récupérerRépartitionMétéoUseCase.run({ territoireCode });

    // Then
    expect(territoireRepository.recupererTerritoireParCode).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(chantierRepository.listerParTerritoireCodePourEtMaille).toHaveBeenNthCalledWith(1, { territoireCode, maille: 'DEPT' });

    expect(result.nombreOrage).toEqual(2);
    expect(result.nombreCouvert).toEqual(1);
    expect(result.nombreNuage).toEqual(0);
    expect(result.nombreSoleil).toEqual(1);
  });

  it('quand au moins un chantier remonte une meteo null, ne doit pas ajouter la meteo au compteur', async () => {
    // Given
    const territoireCode = 'DEPT-34';
    const territoire = new TerritoireBuilder().withMaille('DEPT').build();

    territoireRepository.recupererTerritoireParCode.mockResolvedValue(territoire);

    const chantier1 = new ChantierBuilder().withMeteo('ORAGE').build();
    const chantier2 = new ChantierBuilder().withMeteo('ORAGE').build();
    const chantier3 = new ChantierBuilder().withMeteo(null).build();
    const chantier4 = new ChantierBuilder().withMeteo('SOLEIL').build();

    chantierRepository.listerParTerritoireCodePourEtMaille.mockResolvedValue([chantier1, chantier2, chantier3, chantier4]);

    // When
    const result = await récupérerRépartitionMétéoUseCase.run({ territoireCode });

    // Then
    expect(territoireRepository.recupererTerritoireParCode).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(chantierRepository.listerParTerritoireCodePourEtMaille).toHaveBeenNthCalledWith(1, { territoireCode, maille: 'DEPT' });

    expect(result.nombreOrage).toEqual(2);
    expect(result.nombreCouvert).toEqual(0);
    expect(result.nombreNuage).toEqual(0);
    expect(result.nombreSoleil).toEqual(1);
  });

  it('quand le territoire est une région, doit récupérer la répartition des météos pour un territoire donnée', async () => {
    // Given
    const territoireCode = 'REG';
    const territoire = new TerritoireBuilder().withMaille('REG').build();

    territoireRepository.recupererTerritoireParCode.mockResolvedValue(territoire);

    const chantier1 = new ChantierBuilder().withMeteo('ORAGE').build();
    const chantier2 = new ChantierBuilder().withMeteo('ORAGE').build();
    const chantier3 = new ChantierBuilder().withMeteo('COUVERT').build();
    const chantier4 = new ChantierBuilder().withMeteo('SOLEIL').build();

    chantierRepository.listerParTerritoireCodePourEtMaille.mockResolvedValue([chantier1, chantier2, chantier3, chantier4]);

    // When
    const result = await récupérerRépartitionMétéoUseCase.run({ territoireCode });

    // Then
    expect(territoireRepository.recupererTerritoireParCode).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(chantierRepository.listerParTerritoireCodePourEtMaille).toHaveBeenNthCalledWith(1, { territoireCode, maille: 'REG' });

    expect(result.nombreOrage).toEqual(2);
    expect(result.nombreCouvert).toEqual(1);
    expect(result.nombreNuage).toEqual(0);
    expect(result.nombreSoleil).toEqual(1);
  });
});
