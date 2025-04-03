import { mock, MockProxy } from 'jest-mock-extended';
import { CommentaireRepository } from '@/server/domain/chantier/commentaire/CommentaireRepository.interface';
import { Utilisateur } from '@/server/domain/utilisateur/Utilisateur.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/PrismamailleParser';
import { CréerUnCommentaireUseCase } from './CréerUnCommentaireUseCase';

const RANDOM_UUID = '123';

jest.mock('node:crypto', () => ({
  randomUUID: () => RANDOM_UUID,
}));

describe('CréerUnCommentaireUseCase', () => {
  let commentaireRepository: MockProxy<CommentaireRepository>;

  beforeEach(() => {
    commentaireRepository = mock<CommentaireRepository>();
  });

  test('créé un commentaire', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const chantierId = 'CH-011';
    const maille = 'departementale';
    const codeInsee = '01';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const type = 'risquesEtFreinsÀLever';

    jest.useFakeTimers().setSystemTime(date);
    
    const créerUnCommentaire = new CréerUnCommentaireUseCase({ commentaireRepository });

    const territoireCode = `${CODES_MAILLES[maille]}-${codeInsee}`;

    const habilitation = { 'saisieCommentaire': {
      chantiers: [chantierId],
      territoires: [territoireCode],
    } } as unknown as Utilisateur['habilitations'];

    //WHEN
    await créerUnCommentaire.run(chantierId, territoireCode, contenu, auteur, type, habilitation);

    //THEN
    expect(commentaireRepository.créer).toHaveBeenNthCalledWith(1, chantierId, territoireCode, RANDOM_UUID, contenu, auteur, type, date);
  });

  test('retourne le commentaire créé', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const chantierId = 'CH-011';
    const maille = 'departementale';
    const codeInsee = '01';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const type = 'risquesEtFreinsÀLever';

    jest.useFakeTimers().setSystemTime(date);

    commentaireRepository.créer.mockResolvedValue({
      id: RANDOM_UUID,
      contenu,
      auteur,
      date: date.toISOString(),
      type,
    });
    const créerUnCommentaire = new CréerUnCommentaireUseCase({ commentaireRepository });

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
