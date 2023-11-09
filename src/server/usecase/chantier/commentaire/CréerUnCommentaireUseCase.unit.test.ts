import CommentaireRepository
  from '@/server/domain/chantier/commentaire/CommentaireRepository.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import CréerUnCommentaireUseCase from './CréerUnCommentaireUseCase';

const RANDOM_UUID = '123';

jest.mock('node:crypto', () => ({
  randomUUID: () => RANDOM_UUID,
}));

describe('CréerUnCommentaireUseCase', () => {
  test('créé un commentaire', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const chantierId = 'CH-011';
    const maille = 'départementale';
    const codeInsee = '01';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const type = 'risquesEtFreinsÀLever';

    jest.useFakeTimers().setSystemTime(date);
    const stubCommentaireRepository = { créer: jest.fn() } as unknown as CommentaireRepository;
    const créerUnCommentaire = new CréerUnCommentaireUseCase(stubCommentaireRepository);

    const territoireCode = `${CODES_MAILLES[maille]}-${codeInsee}`;

    const habilitation = { 'saisieCommentaire': {
      chantiers: [chantierId],
      territoires: [territoireCode],
    } } as unknown as Utilisateur['habilitations'];

    //WHEN
    await créerUnCommentaire.run(chantierId, territoireCode, contenu, auteur, type, habilitation);

    //THEN
    expect(stubCommentaireRepository.créer).toHaveBeenNthCalledWith(1, chantierId, territoireCode, RANDOM_UUID, contenu, auteur, type, date);
  });

  test('retourne le commentaire créé', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const chantierId = 'CH-011';
    const maille = 'départementale';
    const codeInsee = '01';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const type = 'risquesEtFreinsÀLever';

    jest.useFakeTimers().setSystemTime(date);
    const stubCommentaireRepository = { créer: jest.fn().mockReturnValue({
      contenu,
      auteur,
      date,
    }) } as unknown as CommentaireRepository;
    const créerUnCommentaire = new CréerUnCommentaireUseCase(stubCommentaireRepository);

    const territoireCode = `${CODES_MAILLES[maille]}-${codeInsee}`;

    const habilitation = { 'saisieCommentaire': {
      chantiers: [chantierId],
      territoires: [territoireCode],
    } } as unknown as Utilisateur['habilitations'];

    //WHEN
    const commentaireCréé = await créerUnCommentaire.run(chantierId, territoireCode, contenu, auteur, type, habilitation);

    //THEN
    expect(commentaireCréé).toStrictEqual({
      contenu,
      auteur,
      date,
    });
  });
});
