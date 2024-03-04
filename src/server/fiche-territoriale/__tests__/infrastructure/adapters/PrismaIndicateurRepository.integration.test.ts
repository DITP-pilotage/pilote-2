import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import {
  PrismaIndicateurRepository,
} from '@/server/fiche-territoriale/infrastructure/adapters/PrismaIndicateurRepository';

describe('PrismaIndicateurRepository', () => {
  let prismaIndicateurRepository: PrismaIndicateurRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new PrismaIndicateurRepository(prisma);
  });

  describe('recupererMapIndicateursParListeChantierIdEtTerritoire', () => {
    it('quand la maille est un département, doit récupérer les indicateurs associés à la liste des chantiers', async () => {
      // Given
      const listeChantierId = ['CH-001', 'CH-002'];
      const maille = 'DEPT';
      const codeInsee = '34';

      await prisma.chantier.create({
        data: {
          id: 'CH-001',
          nom: 'Un nom de chantier 1',
          code_insee: '34',
          maille: 'DEPT',
          territoire_code: 'DEPT-34',
          meteo: 'SOLEIL',
          a_taux_avancement_regional: true,
          a_meteo_regional: true,
          taux_avancement: null,
        },
      });

      await prisma.chantier.create({
        data: {
          id: 'CH-002',
          nom: 'Un nom de chantier 2',
          code_insee: '34',
          maille: 'DEPT',
          meteo: null,
          territoire_code: 'DEPT-34',
          taux_avancement: 2,
        },
      });

      await prisma.chantier.create({
        data: {
          id: 'CH-003',
          nom: 'Un nom de chantier 3',
          code_insee: '06',
          maille: 'REG',
          meteo: 'ORAGE',
          territoire_code: 'REG-06',
          taux_avancement: 1,
        },
      });

      await prisma.chantier.create({
        data: {
          id: 'CH-004',
          nom: 'Un nom de chantier 4',
          code_insee: '87',
          maille: 'DEPT',
          meteo: 'NUAGEUX',
          territoire_code: 'DEPT-87',
          taux_avancement: null,
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-001',
          nom: 'Un nom indicateur 1 OK baromètre',
          chantier_id: 'CH-001',
          code_insee: '34',
          maille: 'DEPT',
          territoire_code: 'DEPT-34',
          est_barometre: true,
          ponderation_dept: null,
          date_valeur_actuelle: '2021-01-01T00:00:00.000Z',
          valeur_actuelle: 10.1,
          objectif_valeur_cible: 11.1,
          objectif_taux_avancement: 12.1,
          unite_mesure: 'Pourcentage',
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-002',
          nom: 'Un nom indicateur 2 OK pondération et maille',
          chantier_id: 'CH-001',
          code_insee: '34',
          maille: 'DEPT',
          territoire_code: 'DEPT-34',
          est_barometre: false,
          ponderation_dept: 20,
          date_valeur_actuelle: '2023-02-04T00:00:00.000Z',
          valeur_actuelle: 22.3,
          objectif_valeur_cible: 23.3,
          objectif_taux_avancement: 24.3,
          unite_mesure: 'Pourcentage',
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-003',
          nom: 'Un nom indicateur 3 OK pondération et maille',
          chantier_id: 'CH-002',
          code_insee: '34',
          maille: 'DEPT',
          territoire_code: 'DEPT-34',
          est_barometre: true,
          ponderation_dept: 20,
          date_valeur_actuelle: '2022-08-02T00:00:00.000Z',
          valeur_actuelle: 31.3,
          objectif_valeur_cible: 32.3,
          objectif_taux_avancement: 33.3,
          unite_mesure: 'million habitant',
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-004',
          nom: 'Un nom indicateur 4 KO maille',
          chantier_id: 'CH-002',
          code_insee: '34',
          maille: 'REG',
          territoire_code: 'REG-06',
          est_barometre: false,
          ponderation_dept: 20,
          date_valeur_actuelle: '2022-08-02T00:00:00.000Z',
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-005',
          nom: 'Un nom indicateur 5 KO chantier id',
          chantier_id: 'CH-003',
          code_insee: '34',
          maille: 'DEPT',
          territoire_code: 'DEPT-34',
          est_barometre: true,
          ponderation_dept: 20,
          date_valeur_actuelle: '2022-08-02T00:00:00.000Z',
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-006',
          nom: 'Un nom indicateur 6 KO pas barometre pondération null',
          chantier_id: 'CH-003',
          code_insee: '34',
          maille: 'DEPT',
          territoire_code: 'DEPT-34',
          est_barometre: false,
          ponderation_dept: null,
          date_valeur_actuelle: '2022-08-02T00:00:00.000Z',
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-007',
          nom: 'Un nom indicateur 7 KO pas barometre pondération 0',
          chantier_id: 'CH-003',
          code_insee: '34',
          maille: 'DEPT',
          territoire_code: 'DEPT-34',
          est_barometre: false,
          ponderation_dept: 0,
          date_valeur_actuelle: '2022-08-02T00:00:00.000Z',
        },
      });

      // When
      const result = await prismaIndicateurRepository.recupererMapIndicateursParListeChantierIdEtTerritoire({ listeChantierId, maille, codeInsee });
      // Then
      expect([...result.keys()]).toEqual(['CH-001', 'CH-002']);
      expect(result.get('CH-001')?.at(0)?.id).toEqual('IND-001');
      expect(result.get('CH-001')?.at(0)?.nom).toEqual('Un nom indicateur 1 OK baromètre');
      expect(result.get('CH-001')?.at(0)?.dateValeurActuelle).toEqual('2021-01-01T00:00:00.000Z');
      expect(result.get('CH-001')?.at(0)?.valeurActuelle).toEqual(10.1);
      expect(result.get('CH-001')?.at(0)?.valeurCible).toEqual(11.1);
      expect(result.get('CH-001')?.at(0)?.uniteMesure).toEqual('Pourcentage');
      expect(result.get('CH-001')?.at(1)?.id).toEqual('IND-002');
      expect(result.get('CH-001')?.at(1)?.nom).toEqual('Un nom indicateur 2 OK pondération et maille');
      expect(result.get('CH-001')?.at(1)?.dateValeurActuelle).toEqual('2023-02-04T00:00:00.000Z');
      expect(result.get('CH-001')?.at(1)?.valeurActuelle).toEqual(22.3);
      expect(result.get('CH-001')?.at(1)?.valeurCible).toEqual(23.3);
      expect(result.get('CH-001')?.at(1)?.uniteMesure).toEqual('Pourcentage');


      expect(result.get('CH-002')?.at(0)?.id).toEqual('IND-003');
      expect(result.get('CH-002')?.at(0)?.nom).toEqual('Un nom indicateur 3 OK pondération et maille');
      expect(result.get('CH-002')?.at(0)?.dateValeurActuelle).toEqual('2022-08-02T00:00:00.000Z');
      expect(result.get('CH-002')?.at(0)?.valeurActuelle).toEqual(31.3);
      expect(result.get('CH-002')?.at(0)?.valeurCible).toEqual(32.3);
      expect(result.get('CH-002')?.at(0)?.uniteMesure).toEqual('million habitant');
    });

    it('quand la maille est une région, doit récupérer les indicateurs associés à la liste des chantiers', async () => {
      // Given
      const listeChantierId = ['CH-001', 'CH-002'];
      const maille = 'REG';
      const codeInsee = '06';

      await prisma.chantier.create({
        data: {
          id: 'CH-001',
          nom: 'Un nom de chantier 1',
          code_insee: '06',
          maille: 'REG',
          territoire_code: 'REG-06',
          meteo: 'SOLEIL',
          a_taux_avancement_regional: true,
          a_meteo_regional: true,
          taux_avancement: null,
        },
      });

      await prisma.chantier.create({
        data: {
          id: 'CH-002',
          nom: 'Un nom de chantier 2',
          code_insee: '06',
          maille: 'REG',
          meteo: null,
          territoire_code: 'REG-06',
          taux_avancement: 2,
        },
      });

      await prisma.chantier.create({
        data: {
          id: 'CH-003',
          nom: 'Un nom de chantier 3',
          code_insee: '34',
          maille: 'DEPT',
          meteo: 'ORAGE',
          territoire_code: 'DEPT-34',
          taux_avancement: 1,
        },
      });

      await prisma.chantier.create({
        data: {
          id: 'CH-004',
          nom: 'Un nom de chantier 4',
          code_insee: '01',
          maille: 'REG',
          meteo: 'NUAGEUX',
          territoire_code: 'REG-01',
          taux_avancement: null,
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-001',
          nom: 'Un nom indicateur 1 OK baromètre',
          chantier_id: 'CH-001',
          code_insee: '06',
          maille: 'REG',
          territoire_code: 'REG-06',
          est_barometre: true,
          ponderation_dept: null,
          date_valeur_actuelle: '2021-01-01T00:00:00.000Z',
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-002',
          nom: 'Un nom indicateur 2 OK pondération et maille',
          chantier_id: 'CH-001',
          code_insee: '06',
          maille: 'REG',
          territoire_code: 'REG-06',
          est_barometre: false,
          ponderation_reg: 20,
          date_valeur_actuelle: '2023-02-04T00:00:00.000Z',
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-003',
          nom: 'Un nom indicateur 3 OK pondération et maille',
          chantier_id: 'CH-002',
          code_insee: '06',
          maille: 'REG',
          territoire_code: 'REG-06',
          est_barometre: true,
          ponderation_reg: 20,
          date_valeur_actuelle: '2022-08-02T00:00:00.000Z',
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-004',
          nom: 'Un nom indicateur 4 KO maille',
          chantier_id: 'CH-002',
          code_insee: '34',
          maille: 'DEPT',
          territoire_code: 'DEPT-34',
          est_barometre: false,
          ponderation_reg: 20,
          date_valeur_actuelle: '2022-08-02T00:00:00.000Z',
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-005',
          nom: 'Un nom indicateur 5 KO chantier id',
          chantier_id: 'CH-003',
          code_insee: '06',
          maille: 'REG',
          territoire_code: 'REG-06',
          est_barometre: true,
          ponderation_reg: 20,
          date_valeur_actuelle: '2022-08-02T00:00:00.000Z',
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-006',
          nom: 'Un nom indicateur 6 KO pas barometre pondération null',
          chantier_id: 'CH-003',
          code_insee: '06',
          maille: 'REG',
          territoire_code: 'REG-06',
          est_barometre: false,
          ponderation_reg: null,
          date_valeur_actuelle: '2022-08-02T00:00:00.000Z',
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-007',
          nom: 'Un nom indicateur 7 KO pas barometre pondération 0',
          chantier_id: 'CH-003',
          code_insee: '06',
          maille: 'REG',
          territoire_code: 'REG-06',
          est_barometre: false,
          ponderation_reg: 0,
          date_valeur_actuelle: '2022-08-02T00:00:00.000Z',
        },
      });

      // When
      const result = await prismaIndicateurRepository.recupererMapIndicateursParListeChantierIdEtTerritoire({ listeChantierId, maille, codeInsee });
      // Then
      expect([...result.keys()]).toEqual(['CH-001', 'CH-002']);
      expect(result.get('CH-001')?.at(0)?.dateValeurActuelle).toEqual('2021-01-01T00:00:00.000Z');
      expect(result.get('CH-001')?.at(1)?.dateValeurActuelle).toEqual('2023-02-04T00:00:00.000Z');


      expect(result.get('CH-002')?.at(0)?.dateValeurActuelle).toEqual('2022-08-02T00:00:00.000Z');
    });
  });

  describe('recupererMapIndicateursNationalParListeIndicateurId', () => {
    it('doit récupérer les indicateurs nationaux associés à la liste des chantiers', async () => {
      // Given
      const listeIndicateurId = ['IND-001', 'IND-002'];

      await prisma.chantier.create({
        data: {
          id: 'CH-001',
          nom: 'Un nom de chantier 1',
          code_insee: '34',
          maille: 'DEPT',
          territoire_code: 'DEPT-34',
          meteo: 'SOLEIL',
          a_taux_avancement_regional: true,
          a_meteo_regional: true,
          taux_avancement: null,
        },
      });

      await prisma.chantier.create({
        data: {
          id: 'CH-002',
          nom: 'Un nom de chantier 2',
          code_insee: '34',
          maille: 'DEPT',
          meteo: null,
          territoire_code: 'DEPT-34',
          taux_avancement: 2,
        },
      });

      await prisma.chantier.create({
        data: {
          id: 'CH-003',
          nom: 'Un nom de chantier 3',
          code_insee: '06',
          maille: 'REG',
          meteo: 'ORAGE',
          territoire_code: 'REG-06',
          taux_avancement: 1,
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-001',
          nom: 'Un nom indicateur 1 KO pas NAT chantier 1',
          chantier_id: 'CH-001',
          code_insee: '34',
          maille: 'DEPT',
          territoire_code: 'DEPT-34',
          objectif_taux_avancement: 9.2,
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-001',
          nom: 'Un nom indicateur 2 OK chantier 1',
          chantier_id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          objectif_taux_avancement: 10.2,
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-002',
          nom: 'Un nom indicateur 3 OK chantier 2',
          chantier_id: 'CH-002',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          objectif_taux_avancement: 11.2,
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-003',
          nom: 'Un nom indicateur 4 KO indic id',
          chantier_id: 'CH-003',
          code_insee: '34',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          objectif_taux_avancement: 13.2,
        },
      });

      // When
      const result = await prismaIndicateurRepository.recupererMapIndicateursNationalParListeIndicateurId({ listeIndicateurId });
      // Then
      expect([...result.keys()]).toEqual(['IND-001', 'IND-002']);
      expect(result.get('IND-001')?.objectifTauxAvancement).toEqual(10.2);

      expect(result.get('IND-002')?.objectifTauxAvancement).toEqual(11.2);
    });
  });
});
