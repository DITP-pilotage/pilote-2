import { mock, MockProxy } from 'jest-mock-extended';
import { TerritoireBuilder } from '@/server/domain/territoire/Territoire.builder';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import {
  RecupererTerritoiresAvecNombreUtilisateursUseCase,
} from '@/server/gestion-utilisateur/usecases/RecupererTerritoiresAvecNombreUtilisateursUseCase';
import { UtilisateurRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository';
import { TerritoireRepository } from '@/server/gestion-utilisateur/domain/ports/TerritoireRepository';

describe('RecupererTerritoiresAvecNombreUtilisateursUseCase', () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let territoireRepository: MockProxy<TerritoireRepository>;
  let récupérerTerritoiresAvecNombreUtilisateursUseCase: RecupererTerritoiresAvecNombreUtilisateursUseCase;

  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    territoireRepository = mock<TerritoireRepository>();
    récupérerTerritoiresAvecNombreUtilisateursUseCase = new RecupererTerritoiresAvecNombreUtilisateursUseCase({
      territoireRepository,
      utilisateurRepository,
    });
  });

  it("doit récupérer les territoires associés aux codes avec un nombre d'utilisateur", async () => {
    // Given
    const territoires = [
      new TerritoireBuilder().avecCode('DEPT-01').avecMaille('departementale').build(),
      new TerritoireBuilder().avecCode('REG-84').avecMaille('regionale').build(),
    ];
    territoireRepository.lister.mockResolvedValue(territoires);
    utilisateurRepository.récupérerNombreUtilisateursParTerritoires.mockResolvedValue({
      'DEPT-01': 2,
      'REG-84': 4,
    });

    // When
    const territoiresResults = await récupérerTerritoiresAvecNombreUtilisateursUseCase.run({ territoireCodes : ['DEPT-01', 'REG-84'] });

    // Then
    expect(territoireRepository.lister).toHaveBeenNthCalledWith(1, ['DEPT-01', 'REG-84']);
    expect(utilisateurRepository.récupérerNombreUtilisateursParTerritoires).toHaveBeenCalledTimes(1);
    expect(utilisateurRepository.récupérerNombreUtilisateursParTerritoires).toHaveBeenNthCalledWith(1, territoires);
    expect(territoiresResults).toHaveLength(2);
    expect(territoiresResults[0]).toHaveProperty('nombreUtilisateur');

  });

  it('si la liste de codes territoires est vide retourne une liste vide', async () => {
    // Given
    const territoires = [] as Territoire[];
    territoireRepository.lister.mockResolvedValue(territoires);
    utilisateurRepository.récupérerNombreUtilisateursParTerritoires.mockResolvedValue({});
    // When
    const territoiresResults = await récupérerTerritoiresAvecNombreUtilisateursUseCase.run({ territoireCodes : [] });

    // Then
    expect(territoireRepository.lister).toHaveBeenNthCalledWith(1, []);
    expect(utilisateurRepository.récupérerNombreUtilisateursParTerritoires).toHaveBeenNthCalledWith(1, territoires);
    expect(utilisateurRepository.récupérerNombreUtilisateursParTerritoires).toHaveBeenCalledTimes(1);
    expect(territoiresResults).toHaveLength(0);

  });

  it('si territoiresCode est null doit retourner tous les territoires', async () => {
    // Given
    const territoires = [
      new TerritoireBuilder().avecCode('DEPT-01').avecMaille('departementale').build(),
      new TerritoireBuilder().avecCode('REG-84').avecMaille('regionale').build(),
      new TerritoireBuilder().avecCode('DEPT-34').avecMaille('departementale').build(),
    ];
    territoireRepository.lister.mockResolvedValue(territoires);
    utilisateurRepository.récupérerNombreUtilisateursParTerritoires.mockResolvedValue({
      'DEPT-01': 2,
      'REG-84': 4,
      'DEPT-34': 1,
    });
    // When
    const territoiresResults = await récupérerTerritoiresAvecNombreUtilisateursUseCase.run({ territoireCodes : null });

    // Then
    expect(territoireRepository.lister).toHaveBeenCalledTimes(1);
    expect(utilisateurRepository.récupérerNombreUtilisateursParTerritoires).toHaveBeenCalledTimes(1);
    expect(utilisateurRepository.récupérerNombreUtilisateursParTerritoires).toHaveBeenNthCalledWith(1, territoires);
    expect(territoiresResults).toHaveLength(3);
    expect(territoiresResults[0]).toHaveProperty('nombreUtilisateur');

  });
});
