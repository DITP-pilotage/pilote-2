import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import ChantierSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import RécupérerChantierUseCase from '@/server/usecase/chantier/RécupérerChantierUseCase';
import { objectEntries } from '@/client/utils/objects/objects';
import MinistèreSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/MinistèreSQLRow.builder';
import PérimètreMinistérielSQLRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/PérimètreMinistérielSQLRow.builder';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import ChantierDatesDeMàjRepository from '@/server/domain/chantier/ChantierDateDeMàjMeteoRepository.interface';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

describe('RécupérerChantierUseCase', () => {
  let récupérerChantierUseCase: RécupérerChantierUseCase;
  let chantierRepository: ChantierRepository;
  let chantierDatesDeMàjRepository: ChantierDatesDeMàjRepository;
  let ministèreRepository: MinistèreRepository;
  let territoireRepository: TerritoireRepository;

  beforeEach(() => {
    chantierRepository = dependencies.getChantierRepository();
    chantierDatesDeMàjRepository = dependencies.getChantierDateDeMàjMeteoRepository();
    ministèreRepository = dependencies.getMinistèreRepository();
    territoireRepository = dependencies.getTerritoireRepository();
    récupérerChantierUseCase = new RécupérerChantierUseCase(chantierRepository, chantierDatesDeMàjRepository, ministèreRepository, territoireRepository);
  });


  const profil = ProfilEnum.DITP_ADMIN;

  test('Accède à un chantier par son id, vérification de quelques champs', async () => {
    // GIVEN
    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecMaille('NAT')
          .avecId('CH-001').avecNom('Chantier 1').avecAxe('Axe 1')
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
    const result1 = await récupérerChantierUseCase.run('CH-001', habilitation, profil);
    const result2 = await récupérerChantierUseCase.run('CH-002', habilitation, profil);

    // THEN
    expect(result1.nom).toEqual('Chantier 1');
    expect(result1.axe).toStrictEqual('Axe 1');
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
          .avecId(chantierId).avecMaille('NAT').avecMétéo('SOLEIL').avecTauxAvancement(18).avecTauxAvancementAnnuel(20).build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('DEPT').avecMétéo('SOLEIL').avecCodeInsee('13').avecTauxAvancement(45).avecTauxAvancementAnnuel(51).build(),
      ],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR', 'DEPT-13'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result = await récupérerChantierUseCase.run(chantierId, habilitation, profil);

    // THEN
    expect(result.mailles.nationale).toMatchObject({
      FR: {
        codeInsee: 'FR',
        avancement: { annuel: 20, global: 18 },
        météo: 'SOLEIL',
      },
    });

    expect(result.mailles.départementale[13]).toMatchObject({
      codeInsee: '13',
      avancement: { annuel: 51, global: 45 },
      météo: 'SOLEIL',
    });

    expect(result.mailles.départementale[12]).toMatchObject({
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
      new MinistèreSQLRowBuilder().avecId('1').avecNom('Agriculture et Alimentation').build(),
      new MinistèreSQLRowBuilder().avecId('2').avecNom('Intérieur').build(),
      new MinistèreSQLRowBuilder().avecId('3').avecNom('Extérieur').build(),
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
          .avecMinistères(['1', '2', '3'])
          .build(),
        new ChantierSQLRowBuilder()
          .avecId('CH-002').avecNom('Chantier 2')
          .avecMaille('NAT')
          .avecMinistères(['2'])
          .build(),
      ],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001', 'CH-002'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result1 = await récupérerChantierUseCase.run('CH-001', habilitation, profil);
    const result2 = await récupérerChantierUseCase.run('CH-002', habilitation, profil);

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
    const result = await récupérerChantierUseCase.run(chantierId, habilitation, profil);

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
    const result = await récupérerChantierUseCase.run(chantierId, habilitation, profil);

    // THEN
    expect(result.estBaromètre).toBe(true);
  });

  test("Contient l'écart entre avec le taux d'avancement du territoire et la médiane à la maille du territoire", async () => {
    // GIVEN
    const chantierId = 'CH-001';

    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('NAT').avecTauxAvancement(75).build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('REG').avecCodeInsee('01').avecTauxAvancement(80).build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('REG').avecCodeInsee('02').avecTauxAvancement(null).build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('REG').avecCodeInsee('03').avecTauxAvancement(10).build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('REG').avecCodeInsee('04').avecTauxAvancement(50).build(),
      ],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR', 'REG-01', 'REG-02', 'REG-03', 'REG-04'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result = await récupérerChantierUseCase.run(chantierId, habilitation, profil);

    // THEN
    expect(result.mailles.régionale['01'].écart).toEqual(30);
    expect(result.mailles.régionale['02'].écart).toBeNull();
    expect(result.mailles.régionale['03'].écart).toEqual(-40);
    expect(result.mailles.régionale['04'].écart).toEqual(0);
  });

  test("Contient la tendance du taux d'avancement du chantier", async () => {
    // GIVEN
    const chantierId = 'CH-001';

    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('NAT').avecTauxAvancement(75).avecTauxAvancementPrécédent(70).build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('DEPT').avecCodeInsee('01').avecTauxAvancement(65).avecTauxAvancementPrécédent(70).build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('DEPT').avecCodeInsee('02').avecTauxAvancement(10).avecTauxAvancementPrécédent(null).build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('DEPT').avecCodeInsee('03').avecTauxAvancement(70).avecTauxAvancementPrécédent(70).build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('DEPT').avecCodeInsee('04').avecTauxAvancement(null).build(),
      ],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR', 'DEPT-01', 'DEPT-02', 'DEPT-03'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result = await récupérerChantierUseCase.run(chantierId, habilitation, profil);

    // THEN
    expect(result.mailles.nationale.FR.tendance).toEqual('HAUSSE');
    expect(result.mailles.départementale['01'].tendance).toEqual('BAISSE');
    expect(result.mailles.départementale['02'].tendance).toEqual('STAGNATION');
    expect(result.mailles.départementale['03'].tendance).toEqual('STAGNATION');
    expect(result.mailles.départementale['04'].tendance).toEqual(null);
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
        await récupérerChantierUseCase.run(chantierId, habilitation, profil);
      };

      // THEN
      await expect(request).rejects.toThrow(/le chantier 'CH-001' n'a pas de maille nationale/);
    });
  });
});
