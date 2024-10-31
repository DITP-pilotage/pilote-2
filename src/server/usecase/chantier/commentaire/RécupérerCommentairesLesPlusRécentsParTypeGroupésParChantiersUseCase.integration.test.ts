import { commentaire } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { Commentaire } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import CommentaireSQLRepository, { CODES_TYPES_COMMENTAIRES, NOMS_TYPES_COMMENTAIRES } from '@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository';
import CommentaireSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase from './RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase';

function mapperVersDomaine(commentairePrisma: commentaire): Commentaire {
  return {
    id: commentairePrisma.id,
    contenu: commentairePrisma.contenu,
    date: commentairePrisma.date.toISOString(),
    auteur: 'Auteur Inconnu',
    type: NOMS_TYPES_COMMENTAIRES[commentairePrisma.type],
  };
}

describe('RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase', () => {
  const commentaireRepository = new CommentaireSQLRepository(prisma);
  const récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase = new RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase(commentaireRepository);

  const auteur_id = randomUUID();
  const chantierId = 'CH-001';
  const commentaireSolutionsEtActionsÀVenirMoinsRécentMailleNationale = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecMaille('NAT')
    .avecDate(new Date('2023-04-19'))
    .avecType(CODES_TYPES_COMMENTAIRES['solutionsEtActionsÀVenir'])
    .build();
  const commentaireSolutionsEtActionsÀVenirLePlusRécentMailleDépartementale = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecMaille('DEPT')
    .avecCodeInsee('75')
    .avecType(CODES_TYPES_COMMENTAIRES['solutionsEtActionsÀVenir'])
    .avecDate(new Date('2023-04-20'))
    .build();
  const commentaireRisquesEtFreinsÀLeverLePlusRécent = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecMaille('NAT')
    .avecDate(new Date('2023-04-19'))
    .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
    .build();
  const commentaireRisquesEtFreinsÀLeverMoinsRécent = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecMaille('NAT')
    .avecDate(new Date('2023-04-18'))
    .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
    .build();
  const commentaireExemplesConcretsDeRéussite = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecMaille('NAT')
    .avecDate(new Date('2023-04-19'))
    .avecType(CODES_TYPES_COMMENTAIRES['exemplesConcretsDeRéussite'])
    .build();
  const commentaireAutresRésultatsObtenus = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecMaille('DEPT')
    .avecCodeInsee('75')
    .avecType(CODES_TYPES_COMMENTAIRES['autresRésultatsObtenus'])
    .avecDate(new Date('2023-04-19'))
    .build();
  const commentaireAutresRésultatsObtenusNonCorrélésAuxIndicateurs = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecMaille('NAT')
    .avecDate(new Date('2023-04-19'))
    .avecType(CODES_TYPES_COMMENTAIRES['autresRésultatsObtenusNonCorrélésAuxIndicateurs'])
    .build();
  const commentairesSurLesDonnéesDept93 = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecMaille('DEPT')
    .avecCodeInsee('93')
    .avecType(CODES_TYPES_COMMENTAIRES['commentairesSurLesDonnées'])
    .avecDate(new Date('2023-04-19'))
    .build();
  const commentairesSurLesDonnéesDept75 = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecMaille('DEPT')
    .avecCodeInsee('75')
    .avecType(CODES_TYPES_COMMENTAIRES['commentairesSurLesDonnées'])
    .avecDate(new Date('2023-04-19'))
    .build();
  const commentaireSansAuteurId = new CommentaireSQLRowBuilder()
    .avecChantierId('CH-003')
    .avecAuteurId(null)
    .avecMaille('DEPT')
    .avecCodeInsee('75')
    .avecType(CODES_TYPES_COMMENTAIRES['commentairesSurLesDonnées'])
    .avecDate(new Date('2023-04-19'))
    .build();
  const commentaireAvecAuteurId = new CommentaireSQLRowBuilder()
    .avecChantierId('CH-004')
    .avecAuteurId(auteur_id)
    .avecMaille('DEPT')
    .avecCodeInsee('75')
    .avecType(CODES_TYPES_COMMENTAIRES['commentairesSurLesDonnées'])
    .avecDate(new Date('2023-04-19'))
    .build();

  it('Retourne les bons libellé des auteurs', async () => {
    const habilitation = { lecture: {
      chantiers: ['CH-003', 'CH-004'],
      territoires: ['DEPT-75'],
    } } as unknown as Utilisateur['habilitations'];

    await prisma.utilisateur.create({
      data: {
        id: auteur_id,
        email: 'john.doe@test.com',
        nom: 'Lasne',
        prenom: 'Paul',
        auteur_modification: 'test',
        date_creation: new Date().toISOString(),
        auteur_creation: 'test',
        profil: {
          connect: {
            code: ProfilEnum.DITP_ADMIN,
          },
        },
      },
    });

    // WHEN
    await prisma.commentaire.createMany({ data: [commentaireAvecAuteurId, commentaireSansAuteurId ] });
    const résultat = await récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run(['CH-003', 'CH-004'], 'DEPT-75', habilitation);

    // THEN
    expect(résultat['CH-003'][0]?.auteur).toStrictEqual('Auteur Inconnu');
    expect(résultat['CH-004'][0]?.auteur).toStrictEqual('Paul Lasne');

  });
  describe('Pour la maille nationale', () => {
    it('Retourne un objet contenant les commentaires les plus récents de chaque type groupés par chantier id', async () => {
      const habilitation = { lecture: {
        chantiers: [chantierId],
        territoires: ['NAT-FR'],
      } } as unknown as Utilisateur['habilitations'];

      // WHEN
      await prisma.commentaire.createMany({ data: [commentaireSolutionsEtActionsÀVenirMoinsRécentMailleNationale, commentaireSolutionsEtActionsÀVenirLePlusRécentMailleDépartementale, commentaireRisquesEtFreinsÀLeverMoinsRécent, commentaireRisquesEtFreinsÀLeverLePlusRécent, commentaireExemplesConcretsDeRéussite, commentaireAutresRésultatsObtenus, commentaireAutresRésultatsObtenusNonCorrélésAuxIndicateurs, commentairesSurLesDonnéesDept93, commentairesSurLesDonnéesDept75] });
      const résultat = await récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run([chantierId], 'NAT-FR', habilitation);

      // THEN
      const attendu = { [chantierId]: [ 
        mapperVersDomaine(commentaireSolutionsEtActionsÀVenirMoinsRécentMailleNationale),
        mapperVersDomaine(commentaireRisquesEtFreinsÀLeverLePlusRécent),
        mapperVersDomaine(commentaireExemplesConcretsDeRéussite),
        mapperVersDomaine(commentaireAutresRésultatsObtenusNonCorrélésAuxIndicateurs),
      ] };
      expect(résultat).toStrictEqual(attendu);
    });
  });

  describe('Pour les mailles départementale et régionale ', () => {
    it('Retourne un objet vide', async () => {
      const habilitation = { lecture: {
        chantiers: [chantierId],
        territoires: ['REG-01'],
      } } as unknown as Utilisateur['habilitations'];

      // WHEN
      await prisma.commentaire.createMany({ data: [commentaireSolutionsEtActionsÀVenirMoinsRécentMailleNationale, commentaireSolutionsEtActionsÀVenirLePlusRécentMailleDépartementale, commentaireRisquesEtFreinsÀLeverMoinsRécent, commentaireRisquesEtFreinsÀLeverLePlusRécent, commentaireExemplesConcretsDeRéussite, commentaireAutresRésultatsObtenus, commentaireAutresRésultatsObtenusNonCorrélésAuxIndicateurs, commentairesSurLesDonnéesDept93, commentairesSurLesDonnéesDept75] });
      const résultat = await récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run([chantierId], 'REG-01', habilitation);

      // THEN
      expect(résultat).toStrictEqual({});
    });

    it('Retourne un objet contenant les commentaires les plus récents de chaque type groupés par chantier id', async () => {
      const habilitation = { lecture: {
        chantiers: [chantierId],
        territoires: ['DEPT-75'],
      } } as unknown as Utilisateur['habilitations'];

      // WHEN
      await prisma.commentaire.createMany({ data: [commentaireSolutionsEtActionsÀVenirMoinsRécentMailleNationale, commentaireSolutionsEtActionsÀVenirLePlusRécentMailleDépartementale, commentaireRisquesEtFreinsÀLeverMoinsRécent, commentaireRisquesEtFreinsÀLeverLePlusRécent, commentaireExemplesConcretsDeRéussite, commentaireAutresRésultatsObtenus, commentaireAutresRésultatsObtenusNonCorrélésAuxIndicateurs, commentairesSurLesDonnéesDept93, commentairesSurLesDonnéesDept75] });
      const résultat = await récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run([chantierId], 'DEPT-75', habilitation);
      
      // THEN
      const attendu = { [chantierId]: [
        mapperVersDomaine(commentaireSolutionsEtActionsÀVenirLePlusRécentMailleDépartementale),
        mapperVersDomaine(commentaireAutresRésultatsObtenus),
        mapperVersDomaine(commentairesSurLesDonnéesDept75),
      ] };
      expect(résultat).toStrictEqual(attendu);
    });
  });
});
