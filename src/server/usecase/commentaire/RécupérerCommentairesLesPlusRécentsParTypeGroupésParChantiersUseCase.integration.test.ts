import { commentaire } from '@prisma/client';
import { Commentaire } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireSQLRepository, { CODES_TYPES_COMMENTAIRES, NOMS_TYPES_COMMENTAIRES } from '@/server/infrastructure/accès_données/commentaire/CommentaireSQLRepository';
import CommentaireSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase from './RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase';

function mapperVersDomaine(commentairePrisma: commentaire): Commentaire {
  return {
    id: commentairePrisma.id,
    contenu: commentairePrisma.contenu,
    date: commentairePrisma.date.toISOString(),
    auteur: commentairePrisma.auteur,
    type: NOMS_TYPES_COMMENTAIRES[commentairePrisma.type],
  };
}

describe('RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase', () => {
  const commentaireRepository = new CommentaireSQLRepository(prisma);
  const récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase = new RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase(commentaireRepository);

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
