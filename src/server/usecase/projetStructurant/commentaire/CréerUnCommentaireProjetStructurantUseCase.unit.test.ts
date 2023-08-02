import CommentaireProjetStructurantRepository from '@/server/domain/projetStructurant/commentaire/CommentaireRepository.interface';
import CréerUnCommentaireProjetStructurantUseCase from './CréerUnCommentaireProjetStructurantUseCase';

const RANDOM_UUID = '7a33ee55-b74c-4464-892b-b2b7fdc3bc58';

jest.mock('node:crypto', () => ({
  randomUUID: () => RANDOM_UUID,
}));

describe('CréerUnCommentaireProjetStructurantUseCase', () => {
  test('créé un commentaire', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const projetStructurantId = 'c4ff3bc7-878a-4449-b1a2-cc56692ecd27';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const type = 'partenariatsEtMoyensMobilisés';

    jest.useFakeTimers().setSystemTime(date);
    const stubCommentaireRepository = { créer: jest.fn() } as unknown as CommentaireProjetStructurantRepository;
    const créerUnCommentaire = new CréerUnCommentaireProjetStructurantUseCase(stubCommentaireRepository);

    // const habilitation = { 'saisie.commentaire': {
    //   chantiers: [chantierId],
    //   territoires: [territoireCode],
    // } } as unknown as Utilisateur['habilitations'];

    //WHEN
    await créerUnCommentaire.run(projetStructurantId, contenu, auteur, type);

    //THEN
    expect(stubCommentaireRepository.créer).toHaveBeenNthCalledWith(1, projetStructurantId, RANDOM_UUID, contenu, auteur, type, date);
  });

  test('retourne le commentaire créé', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const projetStructurantId = 'c4ff3bc7-878a-4449-b1a2-cc56692ecd27';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const type = 'partenariatsEtMoyensMobilisés';

    jest.useFakeTimers().setSystemTime(date);
    const stubCommentaireRepository = { créer: jest.fn().mockReturnValue({
      contenu,
      auteur,
      date,
    }) } as unknown as CommentaireProjetStructurantRepository;
    const créerUnCommentaire = new CréerUnCommentaireProjetStructurantUseCase(stubCommentaireRepository);

    //WHEN
    const commentaireCréé = await créerUnCommentaire.run(projetStructurantId, contenu, auteur, type);
    //THEN
    expect(commentaireCréé).toStrictEqual({
      contenu,
      auteur,
      date,
    });
  });
});
