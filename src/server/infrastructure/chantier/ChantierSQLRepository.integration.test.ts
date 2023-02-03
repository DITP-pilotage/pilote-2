/* eslint-disable sonarjs/no-duplicate-string */
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import ChantierRowBuilder from '@/server/infrastructure/test/tools/rowBuilder/ChantierRowBuilder';
import { météoFromString } from '@/server/domain/chantier/Météo.interface';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierSQLRepository', () => {
  test('Accède à un chantier par son id, vérification de quelques champs', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
    await prisma.chantier.createMany({
      data: [
        new ChantierRowBuilder()
          .withId('CH-001').withNom('Chantier 1').withPérimètresIds(['PER-001', 'PER-002']).withMétéo('COUVERT')
          .withDirecteursAdministrationCentrale(['Alain Térieur', 'Alex Térieur'])
          .withDirectionsAdministrationCentrale(['Intérieur', 'Extérieur'])
          .withDirecteursProjet(['Dir proj 1', 'Dir proj 2'])
          .withDirecteursProjetMail(['dirproj1@example.com', 'dirproj2@example.com'])
          .build(),
        new ChantierRowBuilder()
          .withId('CH-002').withNom('Chantier 2').build(),
      ],
    });

    // WHEN
    const result1 = await repository.getById('CH-001');
    const result2 = await repository.getById('CH-002');

    // THEN
    expect(result1.nom).toEqual('Chantier 1');
    expect(result1.périmètreIds).toStrictEqual(['PER-001', 'PER-002']);
    expect(result1.mailles.nationale.FR.météo).toEqual(météoFromString('COUVERT'));
    expect(result1.responsables.directeursAdminCentrale).toStrictEqual([{ nom: 'Alain Térieur', direction: 'Intérieur' }, { nom: 'Alex Térieur', direction: 'Extérieur' }]);
    expect(result1.responsables.directeursProjet).toStrictEqual([{ nom: 'Dir proj 1', email: 'dirproj1@example.com' }, { nom: 'Dir proj 2', email: 'dirproj2@example.com' }]);

    expect(result2.nom).toEqual('Chantier 2');
  });

  test('un chantier contenant une maille nationale', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);

    const chantierId = 'CH-001';

    await prisma.chantier.create({
      data: new ChantierRowBuilder()
        .withId(chantierId).withMailleNationale().withTauxAvancement(18).build(),
    });

    // WHEN
    const result = await repository.getById(chantierId);

    // THEN
    expect(result.mailles).toStrictEqual({
      nationale: {
        FR: {
          codeInsee: 'FR',
          avancement: { annuel: null, global: 18 },
          météo: météoFromString('SOLEIL'),
        },
      },
      régionale: {},
      départementale: {},
    });
  });

  test('un chantier sans ministères est exclu du résultat', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);

    const chantierId = 'CH-001';

    await prisma.chantier.create({
      data: new ChantierRowBuilder()
        .withId(chantierId).withMailleNationale().withTauxAvancement(18).withMinistères([]).build(),
    });

    // WHEN
    const result = await repository.getListe();

    // THEN
    expect(result).toStrictEqual([]);
  });

  test('un chantier contenant une maille nationale et départementale', async () => {
    // GIVEN
    const chantierId = 'CH-001';
    await prisma.chantier.createMany({
      data: [
        new ChantierRowBuilder()
          .withId(chantierId).withMailleNationale().withTauxAvancement(18).build(),
        new ChantierRowBuilder()
          .withId(chantierId).withMaille('DEPT').withCodeInsee('13').withTauxAvancement(45).build(),
      ],
    });
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);

    // WHEN
    const result = await repository.getById(chantierId);

    // THEN
    expect(result.mailles).toStrictEqual({
      nationale: {
        FR: {
          codeInsee: 'FR',
          avancement: { annuel: null, global: 18 },
          météo: météoFromString('SOLEIL'),
        },
      },
      départementale: {
        '13': {
          codeInsee: '13',
          avancement: { annuel: null, global: 45 },
          météo: météoFromString('SOLEIL'),
        },
      },
      régionale: {},
    });
  });

  test('Contient des porteurs et des coporteurs', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
    await prisma.chantier.createMany({
      data: [
        new ChantierRowBuilder()
          .withId('CH-001').withNom('Chantier 1')
          .withMinistères(['Agriculture et Alimentation', 'Intérieur', 'Extérieur'])
          .build(),
        new ChantierRowBuilder()
          .withId('CH-002').withNom('Chantier 2')
          .withMinistères(['Agriculture et Alimentation'])
          .build(),
      ],
    });

    // WHEN
    const result1 = await repository.getById('CH-001');
    const result2 = await repository.getById('CH-002');

    // THEN
    expect(result1.responsables.porteur).toEqual('Agriculture et Alimentation');
    expect(result1.responsables.coporteurs).toEqual(['Intérieur', 'Extérieur']);

    expect(result2.responsables.porteur).toEqual('Agriculture et Alimentation');
    expect(result2.responsables.coporteurs).toEqual([]);
  });

  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
    await prisma.chantier.createMany({
      data: [
        new ChantierRowBuilder()
          .withId('CH-001').build(),
        new ChantierRowBuilder()
          .withId('CH-002').withMailleNationale().withTauxAvancement(50).build(),
        new ChantierRowBuilder()
          .withId('CH-002').withMaille('DEPT').withCodeInsee('13').withTauxAvancement(50).build(),
      ],
    });

    // WHEN
    const chantiers = await repository.getListe();

    // THEN
    const ids = chantiers.map(chantier => chantier.id);
    expect(ids).toStrictEqual(['CH-001', 'CH-002']);
    expect(chantiers[1].mailles.départementale['13'].avancement.global).toBe(50);
  });

  test('Un code insee sur trois caractères fonctionne', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
    await prisma.chantier.createMany({
      data: [
        new ChantierRowBuilder()
          .withId('CH-001').build(),
        new ChantierRowBuilder()
          .withId('CH-001').withMaille('REG').withCodeInsee('975').build(),
      ],
    });

    // WHEN
    const chantiers = await repository.getListe();

    // THEN
    expect(chantiers[0].mailles.régionale['975']).toBeDefined();
  });

  test('Un directeur de projet peut ne pas avoir d\'adresse email', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);

    const chantierId = 'CH-001';

    await prisma.chantier.create({
      data: new ChantierRowBuilder()
        .withId(chantierId).withDirecteursProjet(['Jean Bon']).withDirecteursProjetMail([]).build(),
    });

    // WHEN
    const result = await repository.getById(chantierId);

    // THEN
    expect(result.responsables.directeursProjet[0]).toStrictEqual({ nom: 'Jean Bon', email: null });
  });

  describe("Gestion d'erreur", () => {
    test('Erreur en cas de chantier non trouvé', async () => {
      // GIVEN
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);
      const chantierId = 'CH-001';
      await prisma.chantier.create({
        data: new ChantierRowBuilder().withId(chantierId).withMailleNationale().build(),
      });

      // WHEN
      const request = async () => {
        await repository.getById('CH-002');
      };

      // THEN
      await expect(request).rejects.toThrow(/chantier 'CH-002' non trouvé/);
    });

    test('Erreur en cas de maille inconnue', async () => {
      // GIVEN
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);
      const chantierId = 'CH-001';
      await prisma.chantier.createMany({
        data: [
          new ChantierRowBuilder()
            .withId(chantierId).withMailleNationale().build(),
          new ChantierRowBuilder()
            .withId(chantierId).withMaille('INCONNUE').build(),
        ],
      });

      // WHEN
      const request = async () => {
        await repository.getById(chantierId);
      };

      // THEN
      await expect(request).rejects.toThrow(/INCONNUE/);
    });

    test('Erreur en cas d\'absence de maille nationale', async () => {
    // GIVEN
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);
      const chantierId = 'CH-001';
      await prisma.chantier.create({
        data: new ChantierRowBuilder().withId(chantierId).withMaille('DEPT').build(),
      });

      // WHEN
      const request = async () => {
        await repository.getById(chantierId);
      };

      // THEN
      await expect(request).rejects.toThrow(/le chantier 'CH-001' n'a pas de maille nationale/);
    });
  });
});
