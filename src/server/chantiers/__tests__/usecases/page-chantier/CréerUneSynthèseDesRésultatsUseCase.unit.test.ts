import { mock, MockProxy } from 'jest-mock-extended';
import { SyntheseDesResultatsRepository } from '@/server/chantiers/domain/ports/SyntheseDesResultatsRepository';
import { CréerUneSynthèseDesRésultatsUseCase } from '@/server/chantiers/usecases/page-chantier/CréerUneSynthèseDesRésultatsUseCase';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/PrismamailleParser';
import { Utilisateur } from '@/server/gestion-utilisateur/domain/Utilisateur';

describe('CréerUneSynthèseDesRésultatsUseCase', () => {
  let synthèsesDesRésultatsRepository: MockProxy<SyntheseDesResultatsRepository>;
  let chantierRepository: MockProxy<ChantierRepository>;

  beforeEach(() => {
    synthèsesDesRésultatsRepository = mock<SyntheseDesResultatsRepository>();
    chantierRepository = mock<ChantierRepository>();
  });
  
  test('créé une synthèse des résultats', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const chantierId = 'CH-011';
    const maille = 'departementale';
    const codeInsee = '01';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const météo = 'SOLEIL';

    jest.useFakeTimers().setSystemTime(date);
    const créerUneSynthèseDesRésultats = new CréerUneSynthèseDesRésultatsUseCase({
      synthèsesDesRésultatsRepository,
      chantierRepository,
    });

    const territoireCode = `${CODES_MAILLES[maille]}-${codeInsee}`;

    // TODO: Enlever le as unknown
    const habilitation = { 'saisieCommentaire': {
      chantiers: [chantierId],
      territoires: [territoireCode],
    } } as unknown as Utilisateur['habilitations'];

    //WHEN
    await créerUneSynthèseDesRésultats.run(chantierId, territoireCode, contenu, auteur, météo, habilitation);

    //THEN
    expect(synthèsesDesRésultatsRepository.créer).toHaveBeenNthCalledWith(1, chantierId, territoireCode, expect.any(String), contenu, auteur, météo, date);
  });

  test('retourne la synthèse des résultats créée', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const chantierId = 'CH-011';
    const maille = 'departementale';
    const codeInsee = '01';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const météo = 'SOLEIL';

    jest.useFakeTimers().setSystemTime(date);
    synthèsesDesRésultatsRepository.créer.mockResolvedValue({
      id: '123',
      contenu,
      auteur,
      date: date.toISOString(),
      météo,
    });

    const créerUneSynthèseDesRésultats = new CréerUneSynthèseDesRésultatsUseCase({
      synthèsesDesRésultatsRepository,
      chantierRepository,
    });

    const territoireCode = `${CODES_MAILLES[maille]}-${codeInsee}`;

    const habilitation = { 'saisieCommentaire': {
      chantiers: [chantierId],
      territoires: [territoireCode],
    } } as unknown as Utilisateur['habilitations'];
    
    //WHEN
    const synthèseDesRésultatsCréée = await créerUneSynthèseDesRésultats.run(chantierId, territoireCode, contenu, auteur, météo, habilitation);

    //THEN
    expect(synthèseDesRésultatsCréée).toStrictEqual({
      contenu,
      auteur,
      date: date.toISOString(),
      météo,
      id: '123',
    });
  });
});
