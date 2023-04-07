import CommentaireRepository
  from '@/server/domain/commentaire/CommentaireRepository.interface';
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
    const type = 'freinsÀLever';

    jest.useFakeTimers().setSystemTime(date);
    const stubCommentaireRepository = { créer: jest.fn() } as unknown as CommentaireRepository;
    const créerUnCommentaire = new CréerUnCommentaireUseCase(stubCommentaireRepository);

    //WHEN
    await créerUnCommentaire.run(chantierId, maille, codeInsee, contenu, auteur, type);

    //THEN
    expect(stubCommentaireRepository.créer).toHaveBeenNthCalledWith(1, chantierId, maille, codeInsee, RANDOM_UUID, contenu, auteur, type, date);
  });

  test('retourne le commentaire créé', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const chantierId = 'CH-011';
    const maille = 'départementale';
    const codeInsee = '01';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const type = 'freinsÀLever';

    jest.useFakeTimers().setSystemTime(date);
    const stubCommentaireRepository = { créer: jest.fn().mockReturnValue({
      contenu,
      auteur,
      date,
    }) } as unknown as CommentaireRepository;
    const créerUnCommentaire = new CréerUnCommentaireUseCase(stubCommentaireRepository);

    //WHEN
    const commentaireCréé = await créerUnCommentaire.run(chantierId, maille, codeInsee, contenu, auteur, type);

    //THEN
    expect(commentaireCréé).toStrictEqual({
      contenu,
      auteur,
      date,
    });
  });
});
