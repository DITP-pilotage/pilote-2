import SynthèseDesRésultatsRepository
  from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import CréerUneSynthèseDesRésultatsUseCase from '@/server/usecase/synthèse/CréerUneSynthèseDesRésultatsUseCase';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

const RANDOM_UUID = '123';

jest.mock('node:crypto', () => ({
  randomUUID: () => RANDOM_UUID,
}));

describe('CréerUneSynthèseDesRésultatsUseCase', () => {
  test('créé une synthèse des résultats', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const chantierId = 'CH-011';
    const maille = 'départementale';
    const codeInsee = '01';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const météo = 'SOLEIL';

    jest.useFakeTimers().setSystemTime(date);
    const stubSynthèseDesRésultatsRepository = { créer: jest.fn() } as unknown as SynthèseDesRésultatsRepository;
    const stubChantierRepository = { modifierMétéo: jest.fn() } as unknown as ChantierRepository;
    const créerUneSynthèseDesRésultats = new CréerUneSynthèseDesRésultatsUseCase(stubSynthèseDesRésultatsRepository, stubChantierRepository);

    const territoireCode = `${CODES_MAILLES[maille]}-${codeInsee}`;

    const habilitation = { 'saisie.commentaire': {
      chantiers: [chantierId],
      territoires: [territoireCode],
    } } as unknown as Utilisateur['habilitations'];

    //WHEN
    await créerUneSynthèseDesRésultats.run(chantierId, territoireCode, contenu, auteur, météo, habilitation);

    //THEN
    expect(stubSynthèseDesRésultatsRepository.créer).toHaveBeenNthCalledWith(1, chantierId, territoireCode, RANDOM_UUID, contenu, auteur, météo, date);
  });

  test('retourne la synthèse des résultats créée', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const chantierId = 'CH-011';
    const maille = 'départementale';
    const codeInsee = '01';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const météo = 'SOLEIL';

    jest.useFakeTimers().setSystemTime(date);
    const stubSynthèseDesRésultatsRepository = { créer: jest.fn().mockReturnValue({
      contenu,
      auteur,
      date,
      météo,
    }) } as unknown as SynthèseDesRésultatsRepository;
    const stubChantierRepository = { modifierMétéo: jest.fn() } as unknown as ChantierRepository;
    const créerUneSynthèseDesRésultats = new CréerUneSynthèseDesRésultatsUseCase(stubSynthèseDesRésultatsRepository, stubChantierRepository);

    const territoireCode = `${CODES_MAILLES[maille]}-${codeInsee}`;

    const habilitation = { 'saisie.commentaire': {
      chantiers: [chantierId],
      territoires: [territoireCode],
    } } as unknown as Utilisateur['habilitations'];
    
    //WHEN
    const synthèseDesRésultatsCréée = await créerUneSynthèseDesRésultats.run(chantierId, territoireCode, contenu, auteur, météo, habilitation);

    //THEN
    expect(synthèseDesRésultatsCréée).toStrictEqual({
      contenu,
      auteur,
      date,
      météo,
    });
  });
});
