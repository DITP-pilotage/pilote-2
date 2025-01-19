import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import RécupérerChantierUseCase from '@/server/usecase/chantier/RécupérerChantierUseCase';
import { objectEntries } from '@/client/utils/objects/objects';
import MinistèreSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/MinistèreSQLRow.builder';
import PérimètreMinistérielSQLRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/PérimètreMinistérielSQLRow.builder';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

describe('RécupérerChantierUseCase', () => {
  let récupérerChantierUseCase: RécupérerChantierUseCase;
  let chantierRepository: ChantierRepository;
  let ministèreRepository: MinistèreRepository;
  let territoireRepository: TerritoireRepository;

  beforeEach(() => {
    chantierRepository = dependencies.getChantierRepository();
    ministèreRepository = dependencies.getMinistèreRepository();
    territoireRepository = dependencies.getTerritoireRepository();
    récupérerChantierUseCase = new RécupérerChantierUseCase(chantierRepository, ministèreRepository, territoireRepository);
  });


  const profil = ProfilEnum.DITP_ADMIN;

  test('Accède à un chantier par son id, vérification de quelques champs', async () => {
    // Given
    await prisma.chantier_identite.createMany({
      data: [{
        id: 'CH-001',
        nom: 'Chantier 001',
        axe: 'Axe 1',
        ppg: 'Ppg 1',
        directeurs_administration_centrale: ['Alain Térieur', 'Alex Térieur'],
        directions_administration_centrale: ['Intérieur', 'Extérieur'],
        directeurs_projet: ['Dir proj 1', 'Dir proj 2'],
        directeurs_projet_mails: ['dirproj1@example.com', 'dirproj2@example.com'],
        est_territorialise: true,
        perimetre_ids: ['PER-01', 'PER-02'],
      }, {
        id: 'CH-002',
        nom: 'Chantier 002',
      }],
    });

    await prisma.chantier_territoire.createMany({
      data: [{
        id: 'CH-001',
        zone_id: 'FRANCE',
        territoire_code: 'NAT-FR',
        maille: 'NAT',
        meteo: 'COUVERT',
        code_insee: 'FR',
      }, {
        id: 'CH-002',
        zone_id: 'FRANCE',
        territoire_code: 'NAT-FR',
        maille: 'NAT',
        code_insee: 'FR',
      }],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001', 'CH-002'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // When
    const result1 = await récupérerChantierUseCase.run('CH-001', habilitation, profil);
    const result2 = await récupérerChantierUseCase.run('CH-002', habilitation, profil);

    // Then
    expect(result1.nom).toEqual('Chantier 001');
    expect(result1.axe).toStrictEqual('Axe 1');
    expect(result1.ppg).toStrictEqual('Ppg 1');
    expect(result1.périmètreIds).toStrictEqual(['PER-01', 'PER-02']);
    expect(result1.mailles.nationale['NAT-FR'].météo).toEqual('COUVERT');
    expect(result1.responsables.directeursAdminCentrale).toStrictEqual([{ nom: 'Alain Térieur', direction: 'Intérieur' }, { nom: 'Alex Térieur', direction: 'Extérieur' }]);
    expect(result1.responsables.directeursProjet).toStrictEqual([{ nom: 'Dir proj 1', email: 'dirproj1@example.com' }, { nom: 'Dir proj 2', email: 'dirproj2@example.com' }]);
    expect(result1.estTerritorialisé).toStrictEqual(true);

    expect(result2.nom).toEqual('Chantier 002');
  });

  test('un chantier contenant une maille nationale et départementale', async () => {
    // Given
    const chantierId = 'CH-001';

    await prisma.chantier_identite.createMany({
      data: [{
        id: 'CH-001',
        nom: 'Chantier 001',
      }],
    });

    await prisma.chantier_territoire.createMany({
      data: [{
        id: 'CH-001',
        zone_id: 'FRANCE',
        territoire_code: 'NAT-FR',
        maille: 'NAT',
        code_insee: 'FR',
        meteo: 'SOLEIL',
        taux_avancement_mandat: 18,
      }, {
        id: 'CH-001',
        zone_id: 'D13',
        territoire_code: 'DEPT-13',
        maille: 'DEPT',
        code_insee: '13',
        meteo: 'SOLEIL',
        taux_avancement_mandat: 45,
      }],
    });

    await prisma.chantier_territoire_jalon.createMany({
      data: [{
        id: 'CH-001',
        territoire_code: 'NAT-FR',
        maille: 'NAT',
        code_insee: 'FR',
        jalon: '2025',
        taux_avancement: 20,
      }, {
        id: 'CH-001',
        territoire_code: 'DEPT-13',
        maille: 'DEPT',
        code_insee: '13',
        jalon: '2025',
        taux_avancement: 51,
      }],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR', 'DEPT-13'],
    } } as unknown as Utilisateur['habilitations'];

    // When
    const result = await récupérerChantierUseCase.run(chantierId, habilitation, profil);

    // Then
    expect(result.mailles.nationale).toMatchObject({
      'NAT-FR': {
        codeInsee: 'FR',
        avancement: { annuel: 20, global: 18 },
        météo: 'SOLEIL',
      },
    });

    expect(result.mailles.departementale['DEPT-13']).toMatchObject({
      codeInsee: '13',
      avancement: { annuel: 51, global: 45 },
      météo: 'SOLEIL',
    });

    expect(result.mailles.departementale['DEPT-12']).toMatchObject({
      codeInsee: '12',
      avancement: { annuel: null, global: null },
      météo: 'NON_RENSEIGNEE',
    });

    expect(objectEntries(result.mailles.departementale)).toHaveLength(101);
    expect(objectEntries(result.mailles.regionale)).toHaveLength(18);
  });

  test('Contient des porteurs et des coporteurs', async () => {
    // Given
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

    await prisma.chantier_identite.createMany({
      data: [{
        id: 'CH-001',
        nom: 'Chantier 001',
        ministeres: ['1', '2', '3'],
      }, {
        id: 'CH-002',
        nom: 'Chantier 002',
        ministeres: ['2'],
      }],
    });

    await prisma.chantier_territoire.createMany({
      data: [{
        id: 'CH-001',
        zone_id: 'FRANCE',
        territoire_code: 'NAT-FR',
        maille: 'NAT',
        code_insee: 'FR',
      }, {
        id: 'CH-002',
        zone_id: 'D13',
        territoire_code: 'DEPT-13',
        maille: 'DEPT',
        code_insee: '13',
      }, {
        id: 'CH-002',
        zone_id: 'FRANCE',
        territoire_code: 'NAT-FR',
        maille: 'NAT',
        code_insee: 'FR',
      }],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001', 'CH-002'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // When
    const result1 = await récupérerChantierUseCase.run('CH-001', habilitation, profil);
    const result2 = await récupérerChantierUseCase.run('CH-002', habilitation, profil);

    // Then
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
    // Given
    const chantierId = 'CH-001';

    await prisma.chantier_identite.createMany({
      data: [{
        id: 'CH-001',
        nom: 'Chantier 001',
        ministeres: ['1', '2', '3'],
        directeurs_projet: ['Jean Bon'],
        directeurs_projet_mails: [],
      }],
    });

    await prisma.chantier_territoire.createMany({
      data: [{
        id: 'CH-001',
        zone_id: 'FRANCE',
        territoire_code: 'NAT-FR',
        maille: 'NAT',
        code_insee: 'FR',
      }],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // When
    const result = await récupérerChantierUseCase.run(chantierId, habilitation, profil);

    // Then
    expect(result.responsables.directeursProjet[0]).toStrictEqual({ nom: 'Jean Bon', email: null });
  });

  test('Un chantier est du baromètre', async () => {
    // Given
    const chantierId = 'CH-001';

    await prisma.chantier_identite.createMany({
      data: [{
        id: 'CH-001',
        nom: 'Chantier 001',
        est_barometre: true,
      }],
    });

    await prisma.chantier_territoire.createMany({
      data: [{
        id: 'CH-001',
        zone_id: 'FRANCE',
        territoire_code: 'NAT-FR',
        maille: 'NAT',
        code_insee: 'FR',
      }],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // When
    const result = await récupérerChantierUseCase.run(chantierId, habilitation, profil);

    // Then
    expect(result.estBaromètre).toBe(true);
  });

  describe("Gestion d'erreur", () => {
    test('Erreur en cas d\'absence de maille nationale', async () => {
      // Given
      const chantierId = 'CH-001';

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          zone_id: 'D12',
          territoire_code: 'DEPT-12',
          maille: 'DEPT',
          code_insee: '12',
        }],
      });

      const habilitation = { lecture: {

        chantiers: ['CH-001'],
        territoires: ['NAT-FR', 'DEPT-12'],
      } } as unknown as Utilisateur['habilitations'];

      // When
      const request = async () => {
        await récupérerChantierUseCase.run(chantierId, habilitation, profil);
      };

      // Then
      await expect(request).rejects.toThrow(/le chantier 'CH-001' n'a pas de maille nationale/);
    });
  });
});
