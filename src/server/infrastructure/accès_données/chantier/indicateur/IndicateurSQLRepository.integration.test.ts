import { indicateur } from '@prisma/client';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { Maille } from '@/server/domain/maille/Maille.interface';
import ChantierSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';
import IndicateurSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/IndicateurSQLRow.builder';
import IndicateurSQLRepository from './IndicateurSQLRepository';

describe('IndicateurSQLRepository', () => {

  describe("Listes d'indicateurs", () => {
    test("Récupère une liste vide quand il n'y a pas d'indicateurs", async () => {
    // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      // WHEN
      const result = await repository.récupérerParChantierId('CH-001');

      // THEN
      expect(result).toStrictEqual([]);
    });

    test('Récupérer une liste d\'indicateur via un ID de chantier contenant un tableau de valeurs actuelles', async () => {
    // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      const chantierId = 'CH-001';

      const indicateurs: indicateur[] = [
        new IndicateurSQLRowBuilder()
          .avecId('IND-001')
          .avecNom('Indicateur 1')
          .avecMaille('NAT')
          .avecChantierId(chantierId)
          .avecSource('ma source')
          .avecDescription('ma description')
          .avecModeDeCalcul('mon mode de calcul')
          .avecEstApplicable(false)
          .build(),

        new IndicateurSQLRowBuilder()
          .avecId('IND-001')
          .avecNom('Indicateur 1')
          .avecChantierId(chantierId)
          .avecCodeInsee('78')
          .avecMaille('REG')
          .avecSource('ma source')
          .avecDescription('ma description')
          .avecModeDeCalcul('mon mode de calcul')
          .avecEstApplicable(false)
          .build(),

        new IndicateurSQLRowBuilder()
          .avecId('IND-002')
          .avecNom('Indicateur 2')
          .avecMaille('NAT')
          .avecChantierId(chantierId)
          .avecSource('ma source')
          .avecDescription('ma description')
          .avecModeDeCalcul('mon mode de calcul')
          .avecEstApplicable(false)
          .build(),
      ];

      await prisma.indicateur.createMany({ data: indicateurs });

      // WHEN
      const result = await repository.récupérerParChantierId(chantierId);

      // THEN
      expect(result.length).toEqual(2);
      expect(result[0].id).toEqual('IND-001');
      expect(result[0].source).toStrictEqual('ma source');
      expect(result[0].modeDeCalcul).toStrictEqual('mon mode de calcul');
      expect(result[1].id).toEqual('IND-002');
      expect(result[1].description).toEqual('ma description');
    });
  });

  describe('récupérerDétails', () => {
    test('Retourne un objet vide si aucun indicateur présent en base', async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      // WHEN
      const result = await repository.récupérerDétails('IND-001',  'départementale');

      // THEN
      expect(result).toStrictEqual({});
    });

    test('Récupère les détails de deux indicateurs présent en base pour un id indicateur et une maille', async () => {
      // GIVEN
      const indicateurId = 'IND-001';
      const maille: Maille = 'départementale';
      const repository = new IndicateurSQLRepository(prisma);

      const indicateurs: indicateur[] = [
        new IndicateurSQLRowBuilder()
          .avecId(indicateurId)
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('02')
          .avecÉvolutionValeurActuelle( [1, 4, 6])
          .avecDateValeurInitiale(new Date('2021-01-01'))
          .avecÉvolutionDateValeurActuelle([new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')])
          .avecValeurInitiale(1001)
          .avecValeurCible(1790)
          .avecValeurActuelle(1500)
          .avecDateValeurActuelle(new Date('2023-03-01'))
          .avecDateValeurCible(new Date('2026-05-01'))
          .avecTauxAvancementCible(40)
          .avecUnité('cm')
          .avecEstApplicable(false)
          .avecDernierImportDateIndic(new Date('2023-03-01'))
          .build(),

        new IndicateurSQLRowBuilder()
          .avecId(indicateurId)
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('03')
          .avecÉvolutionValeurActuelle( [1, 4, 6])
          .avecDateValeurInitiale(new Date('2021-01-01'))
          .avecÉvolutionDateValeurActuelle([new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')])
          .avecValeurInitiale(1001)
          .avecValeurActuelle(1503)
          .avecDateValeurActuelle(new Date('2023-03-01'))
          .avecValeurCible(1790)
          .avecDateValeurCible(new Date('2026-05-01'))
          .avecTauxAvancementCible(40)
          .avecUnité('cm')
          .avecEstApplicable(false)
          .avecDernierImportDateIndic(new Date('2023-03-01'))
          .build(),
      ];

      await prisma.indicateur.createMany({ data: indicateurs });

      // WHEN
      const result = await repository.récupérerDétails(indicateurId, maille);

      // THEN
      expect(result).toStrictEqual(
        {
          [indicateurId]: {
            '02': {
              codeInsee: '02',
              valeurInitiale: 1001,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 4, 6],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1790,
              dateValeurCible: '2026-05-01T00:00:00.000Z',
              dateValeurActuelle: '2023-03-01T00:00:00.000Z',
              valeurCibleAnnuelle: null,
              dateValeurCibleAnnuelle: null,
              valeurActuelle: 1500,
              avancement: {
                global: 40,
                annuel: null,
              },
              unité: 'cm',
              est_applicable: false,
              dateImport: '2023-03-01T00:00:00.000Z',
            },
            '03': {
              codeInsee: '03',
              valeurInitiale: 1001,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 4, 6],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1790,
              dateValeurCible: '2026-05-01T00:00:00.000Z',
              dateValeurActuelle: '2023-03-01T00:00:00.000Z',
              valeurCibleAnnuelle: null,
              dateValeurCibleAnnuelle: null,
              valeurActuelle: 1503,
              avancement: {
                global: 40,
                annuel: null,
              },
              unité: 'cm',
              est_applicable: false,
              dateImport: '2023-03-01T00:00:00.000Z',
            },
          },
        },
      );
    });
  });

  describe('récupererDétailsParChantierIdEtTerritoire', () => {
    test("Récupère une liste vide quand il n'y a pas d'indicateurs", async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      // WHEN
      const result = await repository.récupererDétailsParChantierIdEtTerritoire('CH-001', ['DEPT-01']);

      // THEN
      expect(result).toStrictEqual({});
    });

    test('Récupère les détails de deux indicateurs départemental du même chantier', async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      const indicateurs: indicateur[] = [
        new IndicateurSQLRowBuilder()
          .avecId('IND-001')
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('01')
          .avecÉvolutionValeurActuelle( [1, 2, 3])
          .avecDateValeurInitiale(new Date('2021-01-01'))
          .avecÉvolutionDateValeurActuelle([new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')])
          .avecValeurInitiale(1000)
          .avecValeurCible(1789)
          .avecDateValeurActuelle(new Date('2023-03-01'))
          .avecValeurActuelle(1500)
          .avecDateValeurCible(new Date('2026-05-01'))
          .avecTauxAvancementCible(20)
          .avecUnité('cm')
          .avecEstApplicable(false)
          .avecDernierImportDateIndic(new Date('2023-03-01'))
          .build(),

        new IndicateurSQLRowBuilder()
          .avecId('IND-002')
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('02')
          .avecÉvolutionValeurActuelle( [1, 4, 6])
          .avecDateValeurInitiale(new Date('2021-01-01'))
          .avecÉvolutionDateValeurActuelle([new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')])
          .avecValeurInitiale(1001)
          .avecValeurCible(1790)
          .avecDateValeurCible(new Date('2026-05-01'))
          .avecDateValeurActuelle(new Date('2023-03-01'))
          .avecValeurActuelle(1501)
          .avecTauxAvancementCible(40)
          .avecUnité('cm')
          .avecEstApplicable(false)
          .avecDernierImportDateIndic(new Date('2023-03-01'))
          .build(),

        new IndicateurSQLRowBuilder()
          .avecId('IND-002')
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('03')
          .avecÉvolutionValeurActuelle( [1, 4, 6])
          .avecDateValeurInitiale(new Date('2021-01-01'))
          .avecÉvolutionDateValeurActuelle([new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')])
          .avecValeurInitiale(1001)
          .avecValeurCible(1790)
          .avecDateValeurCible(new Date('2026-05-01'))
          .avecDateValeurActuelle(new Date('2023-03-01'))
          .avecValeurActuelle(1502)
          .avecTauxAvancementCible(40)
          .avecUnité('cm')
          .avecEstApplicable(false)
          .avecDernierImportDateIndic(new Date('2023-03-01'))
          .build(),
      ];

      await prisma.indicateur.createMany({ data: indicateurs });

      // WHEN
      const result = await repository.récupererDétailsParChantierIdEtTerritoire('CH-001', ['DEPT-01', 'DEPT-02', 'DEPT-03']);

      // THEN
      expect(result).toStrictEqual(
        {
          'IND-001': {
            '01': {
              codeInsee: '01',
              valeurInitiale: 1000,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 2, 3],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1789,
              dateValeurCible: '2026-05-01T00:00:00.000Z',
              dateValeurActuelle: '2023-03-01T00:00:00.000Z',
              valeurCibleAnnuelle: null,
              dateValeurCibleAnnuelle: null,
              valeurActuelle: 1500,           
              avancement: {
                global: 20,
                annuel: null,
              },
              unité: 'cm',
              est_applicable: false,
              dateImport: '2023-03-01T00:00:00.000Z',
            },
          },
          'IND-002': {
            '02': {
              codeInsee: '02',
              valeurInitiale: 1001,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 4, 6],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1790,
              dateValeurCible: '2026-05-01T00:00:00.000Z',
              valeurCibleAnnuelle: null,
              dateValeurCibleAnnuelle: null,
              dateValeurActuelle: '2023-03-01T00:00:00.000Z',
              valeurActuelle: 1501,       
              avancement: {
                global: 40,
                annuel: null,
              },
              unité: 'cm',
              est_applicable: false,
              dateImport: '2023-03-01T00:00:00.000Z',
            },
            '03': {
              codeInsee: '03',
              valeurInitiale: 1001,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 4, 6],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1790,
              dateValeurCible: '2026-05-01T00:00:00.000Z',
              valeurCibleAnnuelle: null,
              dateValeurCibleAnnuelle: null,
              dateValeurActuelle: '2023-03-01T00:00:00.000Z',
              valeurActuelle: 1502,       
              avancement: {
                global: 40,
                annuel: null,
              },
              unité: 'cm',
              est_applicable: false,
              dateImport: '2023-03-01T00:00:00.000Z',
            },
          },
        },
      );
    });

    test('Ne récupère pas les indicateurs d\'autres mailles et d\'autres chantiers', async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      const indicateurs: indicateur[] = [
        new IndicateurSQLRowBuilder()
          .avecId('IND-001')
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('01')
          .avecUnité('cm')
          .avecEstApplicable(false)
          .build(),

        new IndicateurSQLRowBuilder()
          .avecId('IND-002')
          .avecChantierId('CH-002')
          .avecMaille('DEPT')
          .avecCodeInsee('02')
          .avecÉvolutionValeurActuelle( [1, 4, 6])
          .avecDateValeurInitiale(new Date('2021-01-01'))
          .avecÉvolutionDateValeurActuelle([new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')])
          .avecValeurInitiale(1001)
          .avecValeurCible(1790)
          .avecDateValeurCible(new Date('2026-05-01'))
          .avecTauxAvancementCible(40)
          .avecUnité('cm')
          .avecEstApplicable(false)
          .avecDernierImportDateIndic(new Date('2023-03-01'))
          .build(),

        new IndicateurSQLRowBuilder()
          .avecId('IND-002')
          .avecChantierId('CH-002')
          .avecMaille('REG')
          .avecCodeInsee('02')
          .avecÉvolutionValeurActuelle( [1, 4, 6])
          .avecDateValeurInitiale(new Date('2021-01-01'))
          .avecÉvolutionDateValeurActuelle([new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')])
          .avecValeurInitiale(1001)
          .avecValeurCible(1790)
          .avecDateValeurCible(new Date('2026-05-01'))
          .avecValeurActuelle(1500)
          .avecDateValeurActuelle(new Date('2023-03-01'))
          .avecTauxAvancementCible(30)
          .avecUnité('cm')
          .avecEstApplicable(false)
          .avecDernierImportDateIndic(new Date('2023-03-01'))
          .build(),
      ];

      await prisma.indicateur.createMany({ data: indicateurs });

      // WHEN
      const result = await repository.récupererDétailsParChantierIdEtTerritoire('CH-002', ['REG-01', 'REG-02']);

      // THEN
      expect(result).toStrictEqual(
        {
          'IND-002': {
            '02': {
              codeInsee: '02',
              valeurInitiale: 1001,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 4, 6],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1790,
              dateValeurCible: '2026-05-01T00:00:00.000Z',
              valeurActuelle: 1500,
              dateValeurActuelle: '2023-03-01T00:00:00.000Z',
              valeurCibleAnnuelle: null,
              dateValeurCibleAnnuelle: null,
              avancement: {
                global: 30,
                annuel: null,
              },
              unité: 'cm',
              est_applicable: false,
              dateImport: '2023-03-01T00:00:00.000Z',
            },
          },
        },
      );
    });
  });

  describe('récupérerPourExports', () => {
    it('deux indicateurs sont triés par noms de chantier en premier', async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);
      const nomDeChantier1 = 'B Chantier 1'; // apparaît en deuxième par ordre alphabétique
      const nomDeChantier2 = 'A Chantier 2'; // apparaît en premier par ordre alphabétique
      await prisma.chantier.createMany({
        data: [
          new ChantierSQLRowBuilder()
            .avecId('CH-001')
            .avecNom(nomDeChantier1)
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .build(),
          new ChantierSQLRowBuilder()
            .avecId('CH-002')
            .avecNom(nomDeChantier2)
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .build(),
          new ChantierSQLRowBuilder()
            .avecId('CH-003')
            .avecNom('C Chantier 3')
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .build(),
        ],
      });
      await prisma.indicateur.createMany({
        data:[
          new IndicateurSQLRowBuilder()
            .avecChantierId('CH-001')
            .avecId('IND-001')
            .avecNom('Indicateur 1 Chantier 1')
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .avecEstApplicable(false)
            .build(),
          new IndicateurSQLRowBuilder()
            .avecChantierId('CH-001')
            .avecId('IND-001')
            .avecNom('Indicateur 1 Chantier 2')
            .avecMaille('DEPT') // Ne doit pas être sélectionné
            .avecCodeInsee('01')
            .avecEstApplicable(false)
            .build(),
          new IndicateurSQLRowBuilder()
            .avecChantierId('CH-002')
            .avecId('IND-002')
            .avecNom('Indicateur 2 Chantier 2')
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .avecEstApplicable(false)
            .build(),
          new IndicateurSQLRowBuilder()
            .avecChantierId('CH-003') // Ne doit pas être sélectionné
            .avecId('IND-003')
            .avecNom('Indicateur 3 Chantier 3')
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .avecEstApplicable(false)
            .build(),
        ],
      });

      // WHEN
      const result = await repository.récupérerPourExports(['CH-001', 'CH-002'], ['NAT-FR']);

      // THEN
      expect(result).toEqual([
        { nom: 'Indicateur 2 Chantier 2', chantierNom: 'A Chantier 2', maille: 'NAT' },
        { nom: 'Indicateur 1 Chantier 1', chantierNom: 'B Chantier 1', maille: 'NAT' },
      ].map(expect.objectContaining));
    });
    it('Récupère la valeur cible annuelle, le ta annuel et la date cible annuelle', async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);
      const nomDeChantier1 = 'B Chantier 1';
      const nomDeChantier2 = 'A Chantier 2';
      await prisma.chantier.createMany({
        data: [
          new ChantierSQLRowBuilder()
            .avecId('CH-001')
            .avecNom(nomDeChantier1)
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .build(),
          new ChantierSQLRowBuilder()
            .avecId('CH-002')
            .avecNom(nomDeChantier2)
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .build(),
        ],
      });
      await prisma.indicateur.createMany({
        data:[
          new IndicateurSQLRowBuilder()
            .avecChantierId('CH-001')
            .avecId('IND-001')
            .avecNom('Indicateur 1 Chantier 1')
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .avecEstApplicable(false)
            .avecDateValeurCibleIntermediaire(new Date('2024-12-01'))
            .avecValeurCibleIntermediaire(22)
            .avecTauxAvancementCibleIntermedaire(12)
            .build(),
          new IndicateurSQLRowBuilder()
            .avecChantierId('CH-002')
            .avecId('IND-002')
            .avecNom('Indicateur 2 Chantier 2')
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .avecEstApplicable(false)
            .avecDateValeurCibleIntermediaire(new Date('2024-12-01'))
            .avecValeurCibleIntermediaire(23)
            .avecTauxAvancementCibleIntermedaire(86)
            .build(),
        ],
      });

      // WHEN
      const result = await repository.récupérerPourExports(['CH-001', 'CH-002'], ['NAT-FR']);

      // THEN
      expect(result).toEqual([
        { 
          nom: 'Indicateur 2 Chantier 2',
          chantierNom: 'A Chantier 2',
          maille: 'NAT',
          dateValeurCibleAnnuelle : new Date('2024-12-01'),
          valeurCibleAnnuelle: 23,
          avancementAnnuel: 86, 
        },
        { 
          nom: 'Indicateur 1 Chantier 1',
          chantierNom: 'B Chantier 1',
          maille: 'NAT', 
          dateValeurCibleAnnuelle : new Date('2024-12-01'),
          valeurCibleAnnuelle: 22,
          avancementAnnuel: 12, 
        },
      ].map(expect.objectContaining));
    });
    it('Récupère l acronyme du ministère', async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);
      const nomDeChantier1 = 'B Chantier 1';
      const nomDeChantier2 = 'A Chantier 2';
      await prisma.chantier.createMany({
        data: [
          new ChantierSQLRowBuilder()
            .avecId('CH-001')
            .avecNom(nomDeChantier1)
            .avecMinistèresAcronyme(['AAAA'])
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .build(),
          new ChantierSQLRowBuilder()
            .avecId('CH-002')
            .avecNom(nomDeChantier2)
            .avecMinistèresAcronyme(['BBBB'])
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .build(),
        ],
      });
      await prisma.indicateur.createMany({
        data:[
          new IndicateurSQLRowBuilder()
            .avecChantierId('CH-001')
            .avecId('IND-001')
            .avecNom('Indicateur 1 Chantier 1')
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .avecEstApplicable(false)
            .build(),
          new IndicateurSQLRowBuilder()
            .avecChantierId('CH-002')
            .avecId('IND-002')
            .avecNom('Indicateur 2 Chantier 2')
            .avecMaille('NAT')
            .avecCodeInsee('FR')
            .avecEstApplicable(false)
            .build(),
        ],
      });

      // WHEN
      const result = await repository.récupérerPourExports(['CH-001', 'CH-002'], ['NAT-FR']);

      // THEN
      expect(result).toEqual([
        { 
          nom: 'Indicateur 2 Chantier 2',
          chantierNom: 'A Chantier 2',
          maille: 'NAT',
          chantierMinistèreNom: 'BBBB',
        },
        { 
          nom: 'Indicateur 1 Chantier 1',
          chantierNom: 'B Chantier 1',
          maille: 'NAT', 
          chantierMinistèreNom: 'AAAA',
        },
      ].map(expect.objectContaining));
    });
  });

  describe('Récupérer la bonne valeur cible annuelle', () => {
    test("Récupère la valeur cible annuelle si valeur cible annuelle est sur l'année en cours", async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      const indicateurs: indicateur[] = [
        new IndicateurSQLRowBuilder()
          .avecId('IND-001')
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('01')
          .avecÉvolutionValeurActuelle( [1, 2, 3])
          .avecDateValeurInitiale(new Date('2021-01-01'))
          .avecÉvolutionDateValeurActuelle([new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')])
          .avecValeurInitiale(1000)
          .avecValeurCible(1789)
          .avecDateValeurActuelle(new Date('2023-03-01'))
          .avecValeurActuelle(1500)
          .avecDateValeurCible(new Date('2026-05-01'))
          .avecTauxAvancementCible(20)
          .avecValeurCibleIntermediaire(1000)
          .avecDateValeurCibleIntermediaire(new Date(new Date().getFullYear().toString() + '-12-31'))
          .avecTauxAvancementCibleIntermedaire(70)
          .avecUnité('cm')
          .avecEstApplicable(false)
          .avecDernierImportDateIndic(new Date('2023-03-01'))
          .build(),
      ];

      await prisma.indicateur.createMany({ data: indicateurs });

      // WHEN
      const result = await repository.récupererDétailsParChantierIdEtTerritoire('CH-001', ['DEPT-01', 'DEPT-02', 'DEPT-03']);

      // THEN
      expect(result).toStrictEqual(
        {
          'IND-001': {
            '01': {
              codeInsee: '01',
              valeurInitiale: 1000,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 2, 3],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1789,
              dateValeurCible: '2026-05-01T00:00:00.000Z',
              dateValeurActuelle: '2023-03-01T00:00:00.000Z',
              valeurCibleAnnuelle: 1000,
              dateValeurCibleAnnuelle: (new Date().getFullYear()).toString() + '-12-31T00:00:00.000Z',
              valeurActuelle: 1500,           
              avancement: {
                global: 20,
                annuel: 70,
              },
              unité: 'cm',
              est_applicable: false,
              dateImport: '2023-03-01T00:00:00.000Z',
            },
          },
        },
      );
    });
    test("Récupère la valeur cible annuelle si valeur cible annuelle n'est pas sur l'année en cours", async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      const indicateurs: indicateur[] = [
        new IndicateurSQLRowBuilder()
          .avecId('IND-001')
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('01')
          .avecÉvolutionValeurActuelle( [1, 2, 3])
          .avecDateValeurInitiale(new Date('2021-01-01'))
          .avecÉvolutionDateValeurActuelle([new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')])
          .avecValeurInitiale(1000)
          .avecValeurCible(1789)
          .avecDateValeurActuelle(new Date('2023-03-01'))
          .avecValeurActuelle(1500)
          .avecDateValeurCible(new Date('2026-05-01'))
          .avecTauxAvancementCible(20)
          .avecValeurCibleIntermediaire(1000)
          .avecDateValeurCibleIntermediaire(new Date((new Date().getFullYear() + 1).toString() + '-12-31'))
          .avecTauxAvancementCibleIntermedaire(70)
          .avecUnité('cm')
          .avecEstApplicable(false)
          .avecDernierImportDateIndic(new Date('2023-03-01'))
          .build(),
      ];

      await prisma.indicateur.createMany({ data: indicateurs });

      // WHEN
      const result = await repository.récupererDétailsParChantierIdEtTerritoire('CH-001', ['DEPT-01', 'DEPT-02', 'DEPT-03']);

      // THEN
      expect(result).toStrictEqual(
        {
          'IND-001': {
            '01': {
              codeInsee: '01',
              valeurInitiale: 1000,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 2, 3],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1789,
              dateValeurCible: '2026-05-01T00:00:00.000Z',
              dateValeurActuelle: '2023-03-01T00:00:00.000Z',
              valeurCibleAnnuelle: null,
              dateValeurCibleAnnuelle: null,
              valeurActuelle: 1500,           
              avancement: {
                global: 20,
                annuel: null,
              },
              unité: 'cm',
              est_applicable: false,
              dateImport: '2023-03-01T00:00:00.000Z',
            },
          },
        },
      );
    });
  });
});
