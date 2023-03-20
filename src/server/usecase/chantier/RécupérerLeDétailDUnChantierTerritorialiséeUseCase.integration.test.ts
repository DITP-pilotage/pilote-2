import { chantier, synthese_des_resultats } from '@prisma/client';
import  SynthèseDesRésultatsSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { commentairesNull } from '@/server/domain/commentaire/Commentaire.interface';
import ChantierSQLRepository from '@/server/infrastructure/accès_données/chantier/ChantierSQLRepository';
import SynthèseDesRésultatsRepository
  from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import {
  SynthèseDesRésultatsSQLRepository,
} from '@/server/infrastructure/accès_données/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import CommentaireSQLRepository from '@/server/infrastructure/accès_données/commentaire/CommentaireSQLRepository';
import {
  RécupérerLeDétailDUnChantierTerritorialiséeUseCase,
} from '@/server/usecase/chantier/RécupérerLeDétailDUnChantierTerritorialiséeUseCase';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import ChantierSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';


describe('RécupérerLeDétailDUnChantierTerritorialiséeUseCase', () => {
  describe('run', function () {
    test('UNIT: renvoie une synthèse des résultats et une météo si le chantier en a en base', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille: Maille = 'régionale';
      const codeInsee = '01';
      const stubChantierRepository = <ChantierRepository>{};
      stubChantierRepository.récupérerMétéoParChantierIdEtTerritoire = () => Promise.resolve('ORAGE');
      const stubSynthèseDesRésultatsRepository = <SynthèseDesRésultatsRepository>{};
      stubSynthèseDesRésultatsRepository.récupérerLaPlusRécenteParChantierIdEtTerritoire = () => Promise.resolve({
        contenu: 'contenu',
        date: '2022-01-01T00:00:00.000Z',
        auteur: 'un auteur',
      });
      const stubCommentaireRepository = <CommentaireRepository>{};
      stubCommentaireRepository.findNewestByChantierIdAndTerritoire = () => Promise.resolve(commentairesNull);
      const récupérerLeDétailDUnChantierTerritorialiséeUseCase = new RécupérerLeDétailDUnChantierTerritorialiséeUseCase(
        stubChantierRepository, stubSynthèseDesRésultatsRepository, stubCommentaireRepository,
      );

      // When
      const result = await récupérerLeDétailDUnChantierTerritorialiséeUseCase.run(chantierId, maille, codeInsee);

      // Then
      expect(result).toStrictEqual(
        {
          synthèseDesRésultats: {
            contenu: 'contenu',
            date: '2022-01-01T00:00:00.000Z',
            auteur: 'un auteur',
          },
          météo: 'ORAGE',
          commentaires: commentairesNull,
        },
      );
    });

    test('INTEGRATION: renvoie une liste vide quand aucune information en base pour le chantier', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille: Maille = 'régionale';
      const codeInsee = '01';
      const chantierRepository: ChantierRepository = new ChantierSQLRepository(prisma);
      const synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);
      const commentaireRepository: CommentaireRepository = new CommentaireSQLRepository(prisma);
      const récupérerLeDétailDUnChantierTerritorialiséeUseCase = new RécupérerLeDétailDUnChantierTerritorialiséeUseCase(
        chantierRepository, synthèseDesRésultatsRepository, commentaireRepository,
      );

      const chantiers: chantier[] = [
        new ChantierSQLRowBuilder()
          .avecId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecMétéo(null)
          .build(),
      ];

      await prisma.chantier.createMany({ data: chantiers });

      // When
      const result = await récupérerLeDétailDUnChantierTerritorialiséeUseCase.run(chantierId, maille, codeInsee);

      // Then
      expect(result).toStrictEqual(
        {
          synthèseDesRésultats: null,
          météo: 'NON_RENSEIGNEE',
          commentaires : commentairesNull,
        },
      );
    });

    test('INTEGRATION: renvoie une synthèse des résultats et une météo si le chantier en a en base', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille: Maille = 'régionale';
      const codeInsee = '01';
      const chantierRepository: ChantierRepository = new ChantierSQLRepository(prisma);
      const synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);
      const commentaireRepository: CommentaireRepository = new CommentaireSQLRepository(prisma);
      const récupérerLeDétailDUnChantierTerritorialiséeUseCase = new RécupérerLeDétailDUnChantierTerritorialiséeUseCase(
        chantierRepository, synthèseDesRésultatsRepository, commentaireRepository,
      );

      const synthesesDesResultats: synthese_des_resultats[] = [
        new SynthèseDesRésultatsSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Lorem ipsum')
          .avecDateCommentaire(new Date('2023-01-01'))
          .build(),
      ];

      const chantiers: chantier[] = [
        new ChantierSQLRowBuilder()
          .avecId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecMétéo('ORAGE')
          .build(),
      ];

      await prisma.synthese_des_resultats.createMany({ data: synthesesDesResultats });
      await prisma.chantier.createMany({ data: chantiers });

      // When
      const result = await récupérerLeDétailDUnChantierTerritorialiséeUseCase.run(chantierId, maille, codeInsee);

      // Then
      expect(result).toStrictEqual(
        {
          synthèseDesRésultats: {
            contenu: 'Lorem ipsum',
            date: '2023-01-01T00:00:00.000Z',
            auteur: '',
          },
          météo: 'ORAGE',
          commentaires: commentairesNull,
        },
      );
    });
  });
});
