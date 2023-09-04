import { faker } from '@faker-js/faker';
import SynthèseDesRésultatsProjetStructurantRepository from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import CréerUneSynthèseDesRésultatsProjetStructurantUseCase from './CréerUneSynthèseDesRésultatsUseCase';

const RANDOM_UUID = '123';

jest.mock('node:crypto', () => ({
  randomUUID: () => RANDOM_UUID,
}));

describe('CréerUneSynthèseDesRésultatsUseCase', () => {
  test('créé une synthèse des résultats', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const projetStructurantId = faker.datatype.uuid();
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const météo = 'SOLEIL';
    const territoireCode = 'DEPT-34';

    jest.useFakeTimers().setSystemTime(date);
    const stubSynthèseDesRésultatsRepository = { créer: jest.fn() } as unknown as SynthèseDesRésultatsProjetStructurantRepository;
    const créerUneSynthèseDesRésultats = new CréerUneSynthèseDesRésultatsProjetStructurantUseCase(stubSynthèseDesRésultatsRepository);

    const habilitation = { 'saisie.commentaire': {
      chantiers: [],
      territoires: [territoireCode],
    } } as unknown as Utilisateur['habilitations'];

    //WHEN
    await créerUneSynthèseDesRésultats.run(projetStructurantId, territoireCode, contenu, auteur, météo, habilitation);

    //THEN
    expect(stubSynthèseDesRésultatsRepository.créer).toHaveBeenNthCalledWith(1, projetStructurantId, RANDOM_UUID, contenu, auteur, météo, date);
  });

  test('retourne la synthèse des résultats créée', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const projetStructurantId = faker.datatype.uuid();
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const météo = 'SOLEIL';
    const territoireCode = 'DEPT-34';

    jest.useFakeTimers().setSystemTime(date);
    const stubSynthèseDesRésultatsRepository = { créer: jest.fn().mockReturnValue({
      contenu,
      auteur,
      date,
      météo,
    }) } as unknown as SynthèseDesRésultatsProjetStructurantRepository;
    const créerUneSynthèseDesRésultats = new CréerUneSynthèseDesRésultatsProjetStructurantUseCase(stubSynthèseDesRésultatsRepository);

    const habilitation = { 'saisie.commentaire': {
      pro: [],
      territoires: [territoireCode],
    } } as unknown as Utilisateur['habilitations'];
    
    //WHEN
    const synthèseDesRésultatsCréée = await créerUneSynthèseDesRésultats.run(projetStructurantId, territoireCode, contenu, auteur, météo, habilitation);

    //THEN
    expect(synthèseDesRésultatsCréée).toStrictEqual({
      contenu,
      auteur,
      date,
      météo,
    });
  });
});
