import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import ChantierSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import RécupérerChantierUseCase from '@/server/usecase/chantier/RécupérerChantierUseCase';
import { objectEntries } from '@/client/utils/objects/objects';
import MinistèreSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/MinistèreSQLRow.builder';
import PérimètreMinistérielSQLRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/PérimètreMinistérielSQLRow.builder';

describe('RécupérerChantierUseCase', () => {

  test('Accède à un chantier par son id, vérification de quelques champs', async () => {
    // GIVEN
    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecMaille('NAT')
          .avecId('CH-001').avecNom('Chantier 1').avecAxe('Axe 1').avecPpg('Ppg 1')
          .avecPérimètreIds(['PER-001', 'PER-002']).avecMétéo('COUVERT')
          .avecDirecteursAdminCentrale(['Alain Térieur', 'Alex Térieur'])
          .avecDirectionsAdminCentrale(['Intérieur', 'Extérieur'])
          .avecDirecteursProjet(['Dir proj 1', 'Dir proj 2'])
          .avecDirecteursProjetMails(['dirproj1@example.com', 'dirproj2@example.com'])
          .avecEstTerritorialisé(true)
          .build(),
        new ChantierSQLRowBuilder()
          .avecMaille('NAT')
          .avecId('CH-002').avecNom('Chantier 2').build(),
      ],
    });
    const habilitation = { lecture: {
      chantiers: ['CH-001', 'CH-002'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result1 = await new RécupérerChantierUseCase().run('CH-001', habilitation);
    const result2 = await new RécupérerChantierUseCase().run('CH-002', habilitation);

    // THEN
    expect(result1.nom).toEqual('Chantier 1');
    expect(result1.axe).toStrictEqual('Axe 1');
    expect(result1.ppg).toStrictEqual('Ppg 1');
    expect(result1.périmètreIds).toStrictEqual(['PER-001', 'PER-002']);
    expect(result1.mailles.nationale.FR.météo).toEqual('COUVERT');
    expect(result1.responsables.directeursAdminCentrale).toStrictEqual([{ nom: 'Alain Térieur', direction: 'Intérieur' }, { nom: 'Alex Térieur', direction: 'Extérieur' }]);
    expect(result1.responsables.directeursProjet).toStrictEqual([{ nom: 'Dir proj 1', email: 'dirproj1@example.com' }, { nom: 'Dir proj 2', email: 'dirproj2@example.com' }]);
    expect(result1.estTerritorialisé).toStrictEqual(true);

    expect(result2.nom).toEqual('Chantier 2');
  });

  test('un chantier contenant une maille nationale et départementale', async () => {
    // GIVEN
    const chantierId = 'CH-001';
    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('NAT').avecMétéo('SOLEIL').avecTauxAvancement(18).build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('DEPT').avecMétéo('SOLEIL').avecCodeInsee('13').avecTauxAvancement(45).build(),
      ],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR', 'DEPT-13'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result = await new RécupérerChantierUseCase().run(chantierId, habilitation);

    // THEN
    expect(result.mailles.nationale).toStrictEqual({
      FR: {
        codeInsee: 'FR',
        avancement: { annuel: null, global: 18 },
        météo: 'SOLEIL',
      },
    });

    expect(result.mailles.départementale[13]).toStrictEqual({
      codeInsee: '13',
      avancement: { annuel: null, global: 45 },
      météo: 'SOLEIL',
    });

    expect(result.mailles.départementale[12]).toStrictEqual({
      codeInsee: '12',
      avancement: { annuel: null, global: null },
      météo: 'NON_RENSEIGNEE',
    });

    expect(objectEntries(result.mailles.départementale)).toHaveLength(101);
    expect(objectEntries(result.mailles.régionale)).toHaveLength(18);
  });

  test('Contient des porteurs et des coporteurs', async () => {
    // GIVEN
    const ministères = [
      new MinistèreSQLRowBuilder().avecNom('Agriculture et Alimentation').build(),
      new MinistèreSQLRowBuilder().avecNom('Intérieur').build(),
      new MinistèreSQLRowBuilder().avecNom('Extérieur').build(),
    ];
    await prisma.ministere.createMany({ data: ministères });
    await prisma.perimetre.createMany({
      data: [
        new PérimètreMinistérielSQLRowBuilder().avecMinistère(ministères[0]).build(),
        new PérimètreMinistérielSQLRowBuilder().avecMinistère(ministères[1]).build(),
        new PérimètreMinistérielSQLRowBuilder().avecMinistère(ministères[2]).build(),
      ],
    });

    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecId('CH-001').avecNom('Chantier 1')
          .avecMaille('NAT')
          .avecMinistères(['Agriculture et Alimentation', 'Intérieur', 'Extérieur'])
          .build(),
        new ChantierSQLRowBuilder()
          .avecId('CH-002').avecNom('Chantier 2')
          .avecMaille('NAT')
          .avecMinistères(['Intérieur'])
          .build(),
      ],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001', 'CH-002'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result1 = await new RécupérerChantierUseCase().run('CH-001', habilitation);
    const result2 = await new RécupérerChantierUseCase().run('CH-002', habilitation);

    // THEN
    expect(result1.responsables.porteur).toBeDefined();
    expect(result1.responsables.porteur!.nom).toEqual('Agriculture et Alimentation');
    expect(result1.responsables.coporteurs).toBeDefined();
    expect(result1.responsables.coporteurs.map(cp => cp.nom)).toEqual(['Intérieur', 'Extérieur']);

    expect(result2.responsables.porteur).toBeDefined();
    expect(result2.responsables.porteur!.nom).toEqual('Intérieur');
    expect(result2.responsables.coporteurs).toBeDefined();
    expect(result2.responsables.coporteurs.map(cp => cp.nom)).toEqual([]);
  });

  test('Un directeur de projet peut ne pas avoir d\'adresse email', async () => {
    // GIVEN

    const chantierId = 'CH-001';

    await prisma.chantier.create({
      data: new ChantierSQLRowBuilder()
        .avecId(chantierId).avecMaille('NAT').avecDirecteursProjet(['Jean Bon']).avecDirecteursProjetMails([]).build(),
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result = await new RécupérerChantierUseCase().run(chantierId, habilitation);

    // THEN
    expect(result.responsables.directeursProjet[0]).toStrictEqual({ nom: 'Jean Bon', email: null });
  });

  test('Un chantier est du baromètre', async () => {
    // GIVEN

    const chantierId = 'CH-001';

    await prisma.chantier.create({
      data: new ChantierSQLRowBuilder()
        .avecId(chantierId).avecMaille('NAT').avecEstBaromètre(true).build(),
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result = await new RécupérerChantierUseCase().run(chantierId, habilitation);

    // THEN
    expect(result.estBaromètre).toBe(true);
  });

  describe("Gestion d'erreur", () => {
    test('Erreur en cas d\'absence de maille nationale', async () => {
      // GIVEN
      const chantierId = 'CH-001';
      await prisma.chantier.create({
        data: new ChantierSQLRowBuilder().avecId(chantierId).avecMaille('DEPT').avecCodeInsee('12').build(),
      });

      const habilitation = { lecture: {

        chantiers: ['CH-001'],
        territoires: ['NAT-FR', 'DEPT-12'],
      } } as unknown as Utilisateur['habilitations'];

      // WHEN
      const request = async () => {
        await new RécupérerChantierUseCase().run(chantierId, habilitation);
      };

      // THEN
      await expect(request).rejects.toThrow(/le chantier 'CH-001' n'a pas de maille nationale/);
    });
  });
});
