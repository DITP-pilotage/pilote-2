import { commentaire } from '@prisma/client';
import { Commentaire } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireSQLRepository, { CODES_TYPES_COMMENTAIRES, NOMS_TYPES_COMMENTAIRES } from '@/server/infrastructure/accès_données/commentaire/CommentaireSQLRepository';
import CommentaireSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import RécupérerCommentairesLesPlusRécentsParTypeUseCase from './RécupérerCommentairesLesPlusRécentsParTypeUseCase';

function mapperVersDomaine(commentairePrisma: commentaire): Commentaire {
  return {
    id: commentairePrisma.id,
    contenu: commentairePrisma.contenu,
    date: commentairePrisma.date.toISOString(),
    auteur: commentairePrisma.auteur,
    type: NOMS_TYPES_COMMENTAIRES[commentairePrisma.type],
  };
}

describe('RécupérerCommentairesLesPlusRécentsParTypeUseCase', () => {
  const commentaireRepository = new CommentaireSQLRepository(prisma);
  const récupérerCommentairesLesPlusRécentsParTypeUseCase = new RécupérerCommentairesLesPlusRécentsParTypeUseCase(commentaireRepository);

  const chantierId = 'CH-001';
  const commentaireSolutionsEtActionsÀVenirMoinsRécentMailleNationale = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecType(CODES_TYPES_COMMENTAIRES['solutionsEtActionsÀVenir'])
    .avecMaille('NAT')
    .avecDate(new Date('2023-04-19'))
    .build();
  const commentaireSolutionsEtActionsÀVenirLePlusRécentMailleDépartementale = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecType(CODES_TYPES_COMMENTAIRES['solutionsEtActionsÀVenir'])
    .avecMaille('DEPT')
    .avecCodeInsee('75')
    .avecDate(new Date('2023-04-20'))
    .build();
  const commentaireRisquesEtFreinsÀLeverLePlusRécent = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
    .avecMaille('NAT')
    .avecDate(new Date('2023-04-19'))
    .build();
  const commentaireRisquesEtFreinsÀLeverMoinsRécent = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
    .avecMaille('NAT')
    .avecDate(new Date('2023-04-18'))
    .build();
  const commentaireExemplesConcretsDeRéussite = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecType(CODES_TYPES_COMMENTAIRES['exemplesConcretsDeRéussite'])
    .avecMaille('NAT')
    .avecDate(new Date('2023-04-19'))
    .build();
  const commentaireAutresRésultatsObtenus = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecType(CODES_TYPES_COMMENTAIRES['autresRésultatsObtenus'])
    .avecMaille('DEPT')
    .avecCodeInsee('75')
    .avecDate(new Date('2023-04-19'))
    .build();
  const commentaireAutresRésultatsObtenusNonCorrélésAuxIndicateurs = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecType(CODES_TYPES_COMMENTAIRES['autresRésultatsObtenusNonCorrélésAuxIndicateurs'])
    .avecMaille('NAT')
    .avecDate(new Date('2023-04-19'))
    .build();
  const commentairesSurLesDonnéesDept93 = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecType(CODES_TYPES_COMMENTAIRES['commentairesSurLesDonnées'])
    .avecMaille('DEPT')
    .avecCodeInsee('93')
    .avecDate(new Date('2023-04-19'))
    .build();
  const commentairesSurLesDonnéesDept75 = new CommentaireSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecType(CODES_TYPES_COMMENTAIRES['commentairesSurLesDonnées'])
    .avecMaille('DEPT')
    .avecCodeInsee('75')
    .avecDate(new Date('2023-04-19'))
    .build();
    
  describe('Pour la maille nationale', () => {
    it('Retourne un objet contenant les commentaires les plus récents avec les bons types', async () => {
      // WHEN
      await prisma.commentaire.createMany({ data: [commentaireSolutionsEtActionsÀVenirMoinsRécentMailleNationale, commentaireSolutionsEtActionsÀVenirLePlusRécentMailleDépartementale, commentaireRisquesEtFreinsÀLeverMoinsRécent, commentaireRisquesEtFreinsÀLeverLePlusRécent, commentaireExemplesConcretsDeRéussite, commentaireAutresRésultatsObtenus, commentaireAutresRésultatsObtenusNonCorrélésAuxIndicateurs, commentairesSurLesDonnéesDept93, commentairesSurLesDonnéesDept75] });
      const résultat = await récupérerCommentairesLesPlusRécentsParTypeUseCase.run(chantierId, 'nationale', 'FR');

      // THEN
      const attendu = [
        { type: 'autresRésultatsObtenusNonCorrélésAuxIndicateurs', publication: mapperVersDomaine(commentaireAutresRésultatsObtenusNonCorrélésAuxIndicateurs) },
        { type: 'risquesEtFreinsÀLever', publication: mapperVersDomaine(commentaireRisquesEtFreinsÀLeverLePlusRécent) },
        { type: 'solutionsEtActionsÀVenir', publication: mapperVersDomaine(commentaireSolutionsEtActionsÀVenirMoinsRécentMailleNationale) },
        { type: 'exemplesConcretsDeRéussite', publication: mapperVersDomaine(commentaireExemplesConcretsDeRéussite) },
      ];
      expect(résultat).toStrictEqual(attendu);
    });
  });

  describe('Pour les mailles départementale et régionale ', () => {
    it('Retourne un objet contenant les bons types et des commentaires null', async () => {
      // WHEN
      await prisma.commentaire.createMany({ data: [commentaireSolutionsEtActionsÀVenirMoinsRécentMailleNationale, commentaireSolutionsEtActionsÀVenirLePlusRécentMailleDépartementale, commentaireRisquesEtFreinsÀLeverMoinsRécent, commentaireRisquesEtFreinsÀLeverLePlusRécent, commentaireExemplesConcretsDeRéussite, commentaireAutresRésultatsObtenus, commentaireAutresRésultatsObtenusNonCorrélésAuxIndicateurs, commentairesSurLesDonnéesDept93, commentairesSurLesDonnéesDept75] });
      const résultat = await récupérerCommentairesLesPlusRécentsParTypeUseCase.run(chantierId, 'régionale', '01');

      // THEN
      const attendu = [
        { type: 'commentairesSurLesDonnées', publication: null },
        { type: 'autresRésultatsObtenus', publication: null },
      ];
      expect(résultat).toStrictEqual(attendu);
    });

    it('Retourne un objet contenant les commentaires les plus récents avec les bons types', async () => {
      // WHEN
      await prisma.commentaire.createMany({ data: [commentaireSolutionsEtActionsÀVenirMoinsRécentMailleNationale, commentaireSolutionsEtActionsÀVenirLePlusRécentMailleDépartementale, commentaireRisquesEtFreinsÀLeverMoinsRécent, commentaireRisquesEtFreinsÀLeverLePlusRécent, commentaireExemplesConcretsDeRéussite, commentaireAutresRésultatsObtenus, commentaireAutresRésultatsObtenusNonCorrélésAuxIndicateurs, commentairesSurLesDonnéesDept93, commentairesSurLesDonnéesDept75] });
      const résultat = await récupérerCommentairesLesPlusRécentsParTypeUseCase.run(chantierId, 'départementale', '75');

      // THEN
      const attendu = [
        { type: 'commentairesSurLesDonnées', publication: mapperVersDomaine(commentairesSurLesDonnéesDept75) },
        { type: 'autresRésultatsObtenus', publication: mapperVersDomaine(commentaireAutresRésultatsObtenus) },
      ];
      expect(résultat).toStrictEqual(attendu);
    });
  });
});
