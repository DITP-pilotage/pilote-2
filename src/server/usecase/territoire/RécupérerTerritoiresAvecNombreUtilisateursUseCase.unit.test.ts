import { mock, MockProxy } from 'jest-mock-extended';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import TerritoireBuilder from '@/server/domain/territoire/Territoire.builder';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { RécupérerTerritoiresAvecNombreUtilisateursUseCase } from './RécupérerTerritoiresAvecNombreUtilisateursUseCase';

describe('RécupérerTerritoiresAvecNombreUtilisateursUseCase', () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let territoireRepository: MockProxy<TerritoireRepository>;
  let récupérerTerritoiresAvecNombreUtilisateursUseCase: RécupérerTerritoiresAvecNombreUtilisateursUseCase;

  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    territoireRepository = mock<TerritoireRepository>();
    récupérerTerritoiresAvecNombreUtilisateursUseCase = new RécupérerTerritoiresAvecNombreUtilisateursUseCase({
      territoireRepository,
      utilisateurRepository,
    });
  });

  it("doit récupérer les territoires associés aux codes avec un nombre d'utilisateur", async () => {
    
    // Given
    const territoires = [
      new TerritoireBuilder().avecCode('DEPT-01').avecMaille('départementale').build(),
      new TerritoireBuilder().avecCode('REG-84').avecMaille('régionale').build(),
    ];
    territoireRepository.récupérerListe.mockResolvedValue(territoires);
    utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire.mockResolvedValue(4);

    // When
    const territoiresResults = await récupérerTerritoiresAvecNombreUtilisateursUseCase.run({ territoireCodes : ['DEPT-01', 'REG-84'] });

    // Then
    expect(territoireRepository.récupérerListe).toHaveBeenNthCalledWith(1, ['DEPT-01', 'REG-84']);
    expect(utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire).toHaveBeenCalledTimes(2);
    expect(utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire).toHaveBeenNthCalledWith(1, 'DEPT-01', 'départementale');
    expect(utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire).toHaveBeenNthCalledWith(2, 'REG-84', 'régionale');
    expect(territoiresResults).toHaveLength(2);
    expect(territoiresResults[0]).toHaveProperty('nombreUtilisateur');

  });

  it('si la liste de codes territoires est vide retourne une liste vide', async () => {
    // Given
    const territoires = [] as Territoire[];
    territoireRepository.récupérerListe.mockResolvedValue(territoires);
    utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire.mockResolvedValue(4);

    // When
    const territoiresResults = await récupérerTerritoiresAvecNombreUtilisateursUseCase.run({ territoireCodes : [] });

    // Then
    expect(territoireRepository.récupérerListe).toHaveBeenNthCalledWith(1, []);
    expect(utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire).toHaveBeenCalledTimes(0);
    expect(territoiresResults).toHaveLength(0);

  });

  it('si territoiresCode est null doit retourner tous les territoires', async () => {
    // Given
    const territoires = [
      new TerritoireBuilder().avecCode('DEPT-01').avecMaille('départementale').build(),
      new TerritoireBuilder().avecCode('REG-84').avecMaille('régionale').build(),
      new TerritoireBuilder().avecCode('DEPT-34').avecMaille('départementale').build(),
    ];
    territoireRepository.récupérerTous.mockResolvedValue(territoires);
    utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire.mockResolvedValue(4);

    // When
    const territoiresResults = await récupérerTerritoiresAvecNombreUtilisateursUseCase.run({ territoireCodes : null });

    // Then
    expect(territoireRepository.récupérerTous).toHaveBeenCalledTimes(1);
    expect(utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire).toHaveBeenCalledTimes(3);
    expect(utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire).toHaveBeenNthCalledWith(1, 'DEPT-01', 'départementale');
    expect(utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire).toHaveBeenNthCalledWith(2, 'REG-84', 'régionale');
    expect(utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire).toHaveBeenNthCalledWith(3, 'DEPT-34', 'départementale');

    expect(territoiresResults).toHaveLength(3);
    expect(territoiresResults[0]).toHaveProperty('nombreUtilisateur');

  });
});
