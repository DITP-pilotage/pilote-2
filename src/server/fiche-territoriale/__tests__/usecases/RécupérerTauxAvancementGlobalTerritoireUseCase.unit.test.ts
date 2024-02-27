import { mock, MockProxy } from 'jest-mock-extended';
import { TerritoireRepository } from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import { TerritoireBuilder } from '@/server/fiche-territoriale/app/builders/TerritoireBuilder';
import {
  RécupérerTauxAvancementGlobalTerritoireUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerTauxAvancementGlobalTerritoireUseCase';
import { ChantierBuilder } from '@/server/fiche-territoriale/app/builders/ChantierBuilder';
import { ChantierRepository } from '@/server/fiche-territoriale/domain/ports/ChantierRepository';

describe('RécupérerTauxAvancementGlobalTerritoireUseCase', () => {
  let chantierRepository: MockProxy<ChantierRepository>;
  let territoireRepository: MockProxy<TerritoireRepository>;
  let récupérerTauxAvancementGlobalTerritoireUseCase: RécupérerTauxAvancementGlobalTerritoireUseCase;

  beforeEach(() => {
    chantierRepository = mock<ChantierRepository>();
    territoireRepository = mock<TerritoireRepository>();
    récupérerTauxAvancementGlobalTerritoireUseCase = new RécupérerTauxAvancementGlobalTerritoireUseCase({ chantierRepository, territoireRepository });
  });
  test("quand le territoire est un departement, doit récupérer la liste des taux d'avancements de ses chantiers", async () => {
    // Given
    const territoireCode = 'UN-CODE';
    const territoire = new TerritoireBuilder().withMaille('DEPT').build();

    const chantier1 = new ChantierBuilder().withTauxAvancement(null).build();
    const chantier2 = new ChantierBuilder().withTauxAvancement(1).build();
    const chantier3 = new ChantierBuilder().withTauxAvancement(2).build();

    territoireRepository.recupererTerritoireParCode.mockResolvedValue(territoire);
    chantierRepository.listerParTerritoireCodePourUnDepartement.mockResolvedValue([chantier1, chantier2, chantier3]);

    // When
    const result = await récupérerTauxAvancementGlobalTerritoireUseCase.run({ territoireCode });

    // Then
    expect(territoireRepository.recupererTerritoireParCode).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(chantierRepository.listerParTerritoireCodePourUnDepartement).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(result).toHaveLength(3);
    expect(result).toStrictEqual([null, 1, 2]);
  });

  test("quand le territoire est une région, doit récupérer la liste des taux d'avancements de ses chantiers", async () => {
    // Given
    const territoireCode = 'UN-CODE';
    const territoire = new TerritoireBuilder().withMaille('REG').build();

    const chantier1 = new ChantierBuilder().withTauxAvancement(null).build();
    const chantier2 = new ChantierBuilder().withTauxAvancement(1).build();
    const chantier3 = new ChantierBuilder().withTauxAvancement(2).build();

    territoireRepository.recupererTerritoireParCode.mockResolvedValue(territoire);
    chantierRepository.listerParTerritoireCodePourUneRegion.mockResolvedValue([chantier1, chantier2, chantier3]);

    // When
    const result = await récupérerTauxAvancementGlobalTerritoireUseCase.run({ territoireCode });

    // Then
    expect(territoireRepository.recupererTerritoireParCode).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(chantierRepository.listerParTerritoireCodePourUneRegion).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(result).toHaveLength(3);
    expect(result).toStrictEqual([null, 1, 2]);
  });

  test('quand le territoire est de maille nationale, doit récupérer aucun chantier', async () => {
    // Given
    const territoireCode = 'UN-CODE';
    const territoire = new TerritoireBuilder().withMaille('NAT').build();

    const chantier1 = new ChantierBuilder().withTauxAvancement(null).build();
    const chantier2 = new ChantierBuilder().withTauxAvancement(1).build();
    const chantier3 = new ChantierBuilder().withTauxAvancement(2).build();

    territoireRepository.recupererTerritoireParCode.mockResolvedValue(territoire);
    chantierRepository.listerParTerritoireCodePourUneRegion.mockResolvedValue([chantier1, chantier2, chantier3]);

    // When
    const result = await récupérerTauxAvancementGlobalTerritoireUseCase.run({ territoireCode });

    // Then
    expect(territoireRepository.recupererTerritoireParCode).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(result).toHaveLength(0);
    expect(result).toStrictEqual([]);
  });
});
