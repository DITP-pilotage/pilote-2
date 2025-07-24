import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { PrismaIndicateurRepository } from '@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository';

describe('PrismaIndicateurRepository', () => {
  let prismaIndicateurRepository: PrismaIndicateurRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new PrismaIndicateurRepository();
  });

  describe('#listerParIndicId', () => {
    it("doit récupérer les données associés à l'indicateur", async () => {
      // Given
      const indicId = 'IND-001';
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Nom chantier OK',
          directeurs_administration_centrale: ['DAC 1', 'DAC 2'],
          directeurs_projet: ['DP 1', 'DP 2'],
        },
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
        }, {
          id: 'CH-001',
          code_insee: 'FR',
          maille: 'REG',
          zone_id: 'R51',
          territoire_code: 'REG-01',
        }],
      });

      await prisma.indicateur_identite.create({
        data: {
          id: 'IND-001',
          nom: 'Indicateur OK',
          chantier_id: 'CH-001',
          type_id: 'IMPACT',
        },
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
          ponderation_zone_reel: 20,
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R51',
          territoire_code: 'REG-01',
          ponderation_zone_reel: 20,
        }],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [{
          id: 'IND-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
          valeur_cible: 20,
          date_valeur_cible: new Date('2024-12-06'),
          taux_avancement: 13,
          valeur_actuelle: 20,
          date_valeur_actuelle: new Date('2024-12-06'),
          jalon: 2024,
        }, {
          id: 'IND-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
          valeur_cible: 22,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          valeur_actuelle: 25,
          date_valeur_actuelle: new Date('2025-12-06'),
          jalon: 2025,
        }, {
          id: 'IND-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'D51',
          territoire_code: 'REG-01',
          valeur_cible: 22,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          jalon: 2025,
          valeur_actuelle: 30,
          date_valeur_actuelle: new Date('2025-12-06'),
        }],
      });

      // When
      const listeDonneesIndicateurs = await prismaIndicateurRepository.listerParIndicId({ indicId, jalon: 2025 });
      // Then
      expect(listeDonneesIndicateurs).toHaveLength(2);
      expect(listeDonneesIndicateurs[0].indicId).toEqual('IND-001');
      expect(listeDonneesIndicateurs[0].territoireCode).toEqual('NAT-FR');
      expect(listeDonneesIndicateurs[0].valeurCibleAnnuelle).toEqual(22);
      expect(listeDonneesIndicateurs[0].dateValeurCibleAnnuelle?.toISOString()).toStartWith('2025-12-06');
      expect(listeDonneesIndicateurs[0].tauxAvancementAnnuel).toEqual(13);
      expect(listeDonneesIndicateurs[0].valeurAvancement).toEqual(25);
      expect(listeDonneesIndicateurs[0].dateValeurAvancement?.toISOString()).toStartWith('2025-12-06');
      expect(listeDonneesIndicateurs[1].indicId).toEqual('IND-001');
      expect(listeDonneesIndicateurs[1].territoireCode).toEqual('REG-01');
      expect(listeDonneesIndicateurs[1].valeurAvancement).toEqual(30);
      expect(listeDonneesIndicateurs[1].dateValeurAvancement?.toISOString()).toStartWith('2025-12-06');
    });

    it("quand on donne un jalon, doit récupérer les données associés à l'indicateur", async () => {
      // Given
      const indicId = 'IND-001';
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Nom chantier OK',
          directeurs_administration_centrale: ['DAC 1', 'DAC 2'],
          directeurs_projet: ['DP 1', 'DP 2'],
        },
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
        }, {
          id: 'CH-001',
          code_insee: 'FR',
          maille: 'REG',
          zone_id: 'R51',
          territoire_code: 'REG-01',
        }],
      });

      await prisma.indicateur_identite.create({
        data: {
          id: 'IND-001',
          nom: 'Indicateur OK',
          chantier_id: 'CH-001',
          type_id: 'IMPACT',
        },
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
          ponderation_zone_reel: 20,
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R51',
          territoire_code: 'REG-01',
          ponderation_zone_reel: 20,
        }],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [{
          id: 'IND-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
          valeur_cible: 20,
          date_valeur_cible: new Date('2024-12-06'),
          taux_avancement: 13,
          valeur_actuelle: 20,
          date_valeur_actuelle: new Date('2024-12-06'),
          jalon: 2024,
        }, {
          id: 'IND-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
          valeur_cible: 22,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          valeur_actuelle: 25,
          date_valeur_actuelle: new Date('2025-12-06'),
          jalon: 2025,
        }, {
          id: 'IND-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'D51',
          territoire_code: 'REG-01',
          valeur_cible: 22,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          jalon: 2025,
          valeur_actuelle: 30,
          date_valeur_actuelle: new Date('2025-12-06'),
        }],
      });

      // When
      const listeDonneesIndicateurs = await prismaIndicateurRepository.listerParIndicId({ indicId, jalon: 2024 });
      // Then
      expect(listeDonneesIndicateurs).toHaveLength(2);
      expect(listeDonneesIndicateurs[0].indicId).toEqual('IND-001');
      expect(listeDonneesIndicateurs[0].territoireCode).toEqual('NAT-FR');
      expect(listeDonneesIndicateurs[0].valeurCibleAnnuelle).toEqual(20);
      expect(listeDonneesIndicateurs[0].dateValeurCibleAnnuelle?.toISOString()).toStartWith('2024-12-06');
      expect(listeDonneesIndicateurs[0].tauxAvancementAnnuel).toEqual(13);
      expect(listeDonneesIndicateurs[0].valeurAvancement).toEqual(20);
      expect(listeDonneesIndicateurs[0].dateValeurAvancement?.toISOString()).toStartWith('2024-12-06');
      expect(listeDonneesIndicateurs[1].indicId).toEqual('IND-001');
      expect(listeDonneesIndicateurs[1].territoireCode).toEqual('REG-01');
      expect(listeDonneesIndicateurs[1].valeurAvancement).toEqual(null);
      expect(listeDonneesIndicateurs[1].dateValeurAvancement).toEqual(null);
    });
  });

  describe('#supprimerPropositionValeurAvancement', () => {
    it("doit supprimer les données associés à la proposition de valeur actuelle de l'indicateur", async () => {
      // Given
      const indicId = 'IND-001';
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Nom chantier OK',
          directeurs_administration_centrale: ['DAC 1', 'DAC 2'],
          directeurs_projet: ['DP 1', 'DP 2'],
        },
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
        }],
      });

      await prisma.indicateur_identite.create({
        data: {
          id: 'IND-001',
          nom: 'Indicateur OK',
          chantier_id: 'CH-001',
          type_id: 'IMPACT',
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: 'IND-001',
          chantier_id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
          ponderation_zone_reel: 20,
          motif_proposition: 'Un motif',
          date_proposition: new Date('2025-12-06'),
          auteur_proposition: 'John Doe',
          valeur_actuelle_proposition: 10,
          source_donnee_methode_calcul_proposition: 'Une source',
          taux_avancement_mandat_proposition: 12,
        },
      });

      await prisma.indicateur_territoire_jalon.create({
        data: {
          id: 'IND-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          jalon: 2025,
          territoire_code: 'NAT-FR',
          taux_avancement_proposition: 30,
        },
      });

      // When
      await prismaIndicateurRepository.supprimerPropositionValeurAvancement({ indicId, territoireCode: 'NAT-FR', auteurModification: 'Jane Doe' });

      // Then
      const indicateur = await prisma.indicateur_identite.findUnique({
        where: {
          id: 'IND-001',
        },
        include: {
          indicateur_territoire: {
            where: {
              territoire_code: 'NAT-FR',
            },
            include: {
              indicateur_territoire_jalon: {
                where: {
                  jalon: 2025,
                  territoire_code: 'NAT-FR',
                },
              },
            },
          },
        },
      });

      expect(indicateur?.indicateur_territoire.at(0)?.motif_proposition).toEqual(null);
      expect(indicateur?.indicateur_territoire.at(0)?.date_proposition).toEqual(null);
      expect(indicateur?.indicateur_territoire.at(0)?.auteur_proposition).toEqual('Jane Doe');
      expect(indicateur?.indicateur_territoire.at(0)?.valeur_actuelle_proposition).toEqual(null);
      expect(indicateur?.indicateur_territoire.at(0)?.source_donnee_methode_calcul_proposition).toEqual(null);
      expect(indicateur?.indicateur_territoire.at(0)?.taux_avancement_mandat_proposition).toEqual(null);
      expect(indicateur?.indicateur_territoire.at(0)?.indicateur_territoire_jalon[0].taux_avancement_proposition).toEqual(null);
    });
  });

  describe('#récupérerPourExports', () => {
    it('doit récupérer les indicateurs pour export', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['MINA'],
          ministeres_acronymes: ['MINA'],
          perimetre_ids: ['PER-01'],
          est_barometre: true,
          est_territorialise: true,
          cible_attendue: true,
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
          ministeres: ['MINA'],
          ministeres_acronymes: ['MINA'],
          cible_attendue: true,
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
          ministeres: ['MINA'],
          ministeres_acronymes: ['MINA'],
          cible_attendue: true,
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
          est_applicable: true,
          ecart: null,
          tendance: null,
          taux_avancement_mandat: null,
        }, {
          id: 'CH-001',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          est_applicable: true,
          taux_avancement_mandat: 23,
          meteo: 'SOLEIL',
          ecart: null,
          tendance: null,
        }, {
          id: 'CH-001',
          code_insee: '02',
          maille: 'DEPT',
          zone_id: 'D02',
          territoire_code: 'DEPT-02',
          est_applicable: true,
          ecart: null,
          tendance: null,
        }, {
          id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
          est_applicable: true,
          ecart: null,
          tendance: null,
        }, {
          id: 'CH-002',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          est_applicable: true,
          ecart: null,
          tendance: null,
        }, {
          id: 'CH-002',
          code_insee: '87',
          maille: 'DEPT',
          zone_id: 'D87',
          territoire_code: 'DEPT-87',
          est_applicable: true,
          ecart: null,
          tendance: null,
        },  {
          id: 'CH-002',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
          est_applicable: true,
          ecart: null,
          tendance: null,
        }, {
          id: 'CH-003',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          est_applicable: true,
          ecart: null,
          tendance: null,
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          dernier_import_date_indic: new Date('2026-01-12'),
          type_id: 'IMPACT',
          unite_mesure: 'kg',
        }, {
          id: 'IND-002',
          nom: 'Indicateur 002',
          chantier_id: 'CH-002',
          dernier_import_date_indic: new Date('2026-01-13'),
          unite_mesure: 'mg',
          type_id: 'IMPACT',
        }, {
          id: 'IND-003',
          nom: 'Indicateur 003',
          chantier_id: 'CH-003',
        }, {
          id: 'IND-004',
          nom: 'Indicateur 004',
          chantier_id: 'CH-002',
          type_id: 'IMPACT',
        }, {
          id: 'IND-005',
          nom: 'Indicateur 005',
          chantier_id: 'CH-001',
          type_id: 'IMPACT',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
          ponderation_zone_reel: 22,
          date_valeur_actuelle_mandat: new Date('2025-01-13'),
          date_valeur_cible_mandat: new Date('2025-01-13'),
          date_valeur_initiale: new Date('2025-01-13'),
          est_a_jour: false,
          est_applicable: true,
          evolution_valeur_actuelle: [{ date: new Date('2024-06-12') }] as unknown as Prisma.JsonArray,
          prochaine_date_maj_jours: 50,
          prochaine_date_maj: new Date('2025-08-31'),
          prochaine_date_valeur_actuelle: new Date('2025-09-31'),
          valeur_actuelle_proposition: 10,
          taux_avancement_mandat_proposition: 11,
          auteur_proposition: 'John Doe',
          motif_proposition: 'Pendant un test',
          source_donnee_methode_calcul_proposition: 'test integ',
          date_proposition: new Date('2025-02-06'),
          tendance: 'HAUSSE',
          valeur_actuelle_mandat: 10,
          valeur_cible_mandat: 11,
          valeur_initiale: 12,
          taux_avancement_mandat: 13,
        },  {
          id: 'IND-001',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          ponderation_zone_reel: 22,
          date_valeur_actuelle_mandat: new Date('2025-01-13'),
          date_valeur_cible_mandat: new Date('2025-01-13'),
          date_valeur_initiale: new Date('2025-01-13'),
          est_a_jour: false,
          est_applicable: true,
          evolution_valeur_actuelle: [{ date: new Date('2024-06-12') }] as unknown as Prisma.JsonArray,
          prochaine_date_maj_jours: 50,
          prochaine_date_maj: new Date('2025-08-31'),
          prochaine_date_valeur_actuelle: new Date('2025-09-31'),
          valeur_actuelle_proposition: 10,
          taux_avancement_mandat_proposition: 11,
          auteur_proposition: 'John Doe',
          motif_proposition: 'Pendant un test',
          source_donnee_methode_calcul_proposition: 'test integ',
          date_proposition: new Date('2025-02-06'),
          tendance: 'HAUSSE',
          valeur_actuelle_mandat: 10,
          valeur_cible_mandat: 11,
          valeur_initiale: 12,
          taux_avancement_mandat: 13,
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          code_insee: '02',
          maille: 'DEPT',
          zone_id: 'D02',
          territoire_code: 'DEPT-02',
          date_valeur_actuelle_mandat: new Date('2025-01-13'),
          date_valeur_cible_mandat: new Date('2025-01-13'),
          date_valeur_initiale: new Date('2025-01-13'),
          est_a_jour: false,
          est_applicable: true,
          evolution_valeur_actuelle: [{ date: new Date('2024-06-12') }] as unknown as Prisma.JsonArray,
          prochaine_date_maj_jours: 50,
          prochaine_date_maj: new Date('2025-08-31'),
          prochaine_date_valeur_actuelle: new Date('2025-09-31'),
          valeur_actuelle_proposition: 10,
          taux_avancement_mandat_proposition: 11,
          auteur_proposition: 'John Doe',
          motif_proposition: 'Pendant un test',
          source_donnee_methode_calcul_proposition: 'test integ',
          date_proposition: new Date('2025-02-06'),
          tendance: 'HAUSSE',
          valeur_actuelle_mandat: 10,
          valeur_cible_mandat: 11,
          valeur_initiale: 12,
        }, {
          id: 'IND-002',
          chantier_id: 'CH-002',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'IND-003',
          chantier_id: 'CH-003',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'IND-005',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
          date_valeur_actuelle_mandat: new Date('2025-01-13'),
          date_valeur_cible_mandat: new Date('2025-01-13'),
          date_valeur_initiale: new Date('2025-01-13'),
          est_a_jour: false,
          est_applicable: true,
          evolution_valeur_actuelle: [{ date: new Date('2024-06-12') }] as unknown as Prisma.JsonArray,
          prochaine_date_maj_jours: 50,
          prochaine_date_maj: new Date('2025-08-31'),
          prochaine_date_valeur_actuelle: new Date('2025-09-31'),
          valeur_actuelle_proposition: 10,
          taux_avancement_mandat_proposition: 11,
          auteur_proposition: 'John Doe',
          motif_proposition: 'Pendant un test',
          source_donnee_methode_calcul_proposition: 'test integ',
          date_proposition: new Date('2025-02-06'),
          tendance: 'HAUSSE',
          valeur_actuelle_mandat: 10,
          valeur_cible_mandat: 11,
          valeur_initiale: 12,
          taux_avancement_mandat: 13,
        }],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [{
          id: 'IND-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
          valeur_cible: 20,
          date_valeur_cible: new Date('2024-12-06'),
          taux_avancement: 13,
          jalon: 2024,
        }, {
          id: 'IND-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
          valeur_cible: 22,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          jalon: 2025,
        }, {
          id: 'IND-001',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          valeur_cible: 24,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          valeur_actuelle: 10,
          date_valeur_actuelle: new Date('2025-01-13'),
          jalon: 2025,
        }, {
          id: 'IND-001',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          valeur_cible: 22,
          date_valeur_cible: new Date('2024-12-06'),
          taux_avancement: 13,
          jalon: 2024,
          valeur_actuelle: 10,
          date_valeur_actuelle: new Date('2024-01-13'),
          taux_avancement_proposition: 12,
        }, {
          id: 'IND-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
          valeur_cible: 22,
          date_valeur_cible: new Date('2024-12-06'),
          taux_avancement: 13,
          jalon: 2024,
          valeur_actuelle: 10,
          date_valeur_actuelle: new Date('2024-01-13'),
          taux_avancement_proposition: 12,
        }, {
          id: 'IND-001',
          code_insee: '02',
          maille: 'DEPT',
          zone_id: 'D02',
          territoire_code: 'DEPT-02',
          valeur_cible: 22,
          date_valeur_cible: new Date('2024-12-06'),
          taux_avancement: 13,
          jalon: 2024,
          taux_avancement_proposition: 12,
          date_valeur_actuelle: new Date('2024-01-13'),
          valeur_actuelle: 10,
        }, {
          id: 'IND-002',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          valeur_cible: 24,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          jalon: 2025,
        }, {
          id: 'IND-002',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          valeur_cible: 22,
          date_valeur_cible: new Date('2024-12-06'),
          taux_avancement: 13,
          jalon: 2024,
          taux_avancement_proposition: 12,
        }, {
          id: 'IND-003',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          valeur_cible: 24,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          jalon: 2025,
        }, {
          id: 'IND-003',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          valeur_cible: 22,
          date_valeur_cible: new Date('2024-12-06'),
          taux_avancement: 13,
          jalon: 2024,
          taux_avancement_proposition: 12,
        }, {
          id: 'IND-005',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
          valeur_cible: 22,
          date_valeur_cible: new Date('2024-12-06'),
          taux_avancement: 13,
          jalon: 2024,
          taux_avancement_proposition: 12,
          date_valeur_actuelle: new Date('2024-03-13'),
          valeur_actuelle: 20,
        }],
      });
      const jalon = 2024;

      // When
      const result = await prismaIndicateurRepository.récupérerPourExports('CH-001', ['DEPT-01', 'DEPT-02', 'REG-01'], jalon);

      // Then
      expect(result).toIncludeAllMembers([{
        nom: 'Indicateur 001',
        maille: 'REG',
        régionNom: 'Guadeloupe',
        départementNom: null,
        codeInsee: '01',
        chantierMinistèreNom: 'MINA',
        axe: 'non renseigné',
        chantierNom: 'Chantier 001',
        chantierId: 'CH-001',
        chantierStatut: 'PUBLIE',
        chantierEstBaromètre: true,
        chantierEstTerritorialise: true,
        chantierEstApplicable: true,
        chantierAvancementGlobal: null,
        chantierAvancementAnnuel: null,
        périmètreIds: ['PER-01'],
        météo: 'NON_RENSEIGNEE',
        valeurInitiale: 12,
        dateValeurInitiale: new Date('2025-01-13').toISOString(),
        valeurAvancement: 10,
        dateValeurAvancement: new Date('2024-01-13').toISOString(),
        valeurCibleAnnuelle: 22,
        dateValeurCibleAnnuelle: new Date('2024-12-06').toISOString(),
        avancementAnnuel: 13,
        valeurCible: 11,
        dateValeurCible: new Date('2025-01-13').toISOString(),
        avancementGlobal: 13,
        estApplicable: true,
        maillesApplicables: [],
        chantierEcart: null,
        chantierTendance: null,
        chantierCibleAttendue: true,
        chantierAUnTauxAvancementDepartemental: true,
        chantierAUnePropositionValeurAvancement: false,
      }, {
        nom: 'Indicateur 001',
        maille: 'DEPT',
        régionNom: 'Hauts-de-France',
        départementNom: 'Aisne',
        codeInsee: '02',
        chantierMinistèreNom: 'MINA',
        axe: 'non renseigné',
        chantierNom: 'Chantier 001',
        chantierId: 'CH-001',
        chantierStatut: 'PUBLIE',
        chantierEstBaromètre: true,
        chantierEstTerritorialise: true,
        chantierEstApplicable: true,
        chantierAvancementGlobal: null,
        chantierAvancementAnnuel: null,
        périmètreIds: ['PER-01'],
        météo: 'NON_RENSEIGNEE',
        valeurInitiale: 12,
        dateValeurInitiale: new Date('2025-01-13').toISOString(),
        valeurAvancement: 10,
        dateValeurAvancement: new Date('2024-01-13').toISOString(),
        valeurCibleAnnuelle: 22,
        dateValeurCibleAnnuelle: new Date('2024-12-06').toISOString(),
        avancementAnnuel: 13,
        valeurCible: 11,
        dateValeurCible: new Date('2025-01-13').toISOString(),
        avancementGlobal: null,
        estApplicable: true,
        maillesApplicables: [],
        chantierEcart: null,
        chantierTendance: null,
        chantierCibleAttendue: true,
        chantierAUnTauxAvancementDepartemental: true,
        chantierAUnePropositionValeurAvancement: false,
      }, {
        nom: 'Indicateur 001',
        maille: 'DEPT',
        régionNom: 'Auvergne-Rhône-Alpes',
        départementNom: 'Ain',
        codeInsee: '01',
        chantierMinistèreNom: 'MINA',
        axe: 'non renseigné',
        chantierNom: 'Chantier 001',
        chantierId: 'CH-001',
        chantierStatut: 'PUBLIE',
        chantierEstBaromètre: true,
        chantierEstTerritorialise: true,
        chantierEstApplicable: true,
        chantierAvancementGlobal: 23,
        chantierAvancementAnnuel: null,
        périmètreIds: ['PER-01'],
        météo: 'SOLEIL',
        valeurInitiale: 12,
        dateValeurInitiale: new Date('2025-01-13').toISOString(),
        valeurAvancement: 10,
        dateValeurAvancement: new Date('2024-01-13').toISOString(),
        valeurCibleAnnuelle: 22,
        dateValeurCibleAnnuelle: new Date('2024-12-06').toISOString(),
        avancementAnnuel: 13,
        valeurCible: 11,
        dateValeurCible: new Date('2025-01-13').toISOString(),
        avancementGlobal: 13,
        estApplicable: true,
        maillesApplicables: [],
        chantierEcart: null,
        chantierTendance: null,
        chantierCibleAttendue: true,
        chantierAUnTauxAvancementDepartemental: true,
        chantierAUnePropositionValeurAvancement: false,
      }, {
        avancementAnnuel: 13,
        avancementGlobal: 13,
        axe: 'non renseigné',
        chantierAvancementAnnuel: null,
        chantierAvancementGlobal: null,
        chantierEstApplicable: true,
        chantierEstBaromètre: true,
        chantierEstTerritorialise: true,
        chantierId: 'CH-001',
        chantierMinistèreNom: 'MINA',
        chantierNom: 'Chantier 001',
        chantierStatut: 'PUBLIE',
        codeInsee: '01',
        dateValeurAvancement: '2024-03-13T00:00:00.000Z',
        dateValeurCible: '2025-01-13T00:00:00.000Z',
        dateValeurCibleAnnuelle: '2024-12-06T00:00:00.000Z',
        dateValeurInitiale: '2025-01-13T00:00:00.000Z',
        départementNom: null,
        estApplicable: true,
        maille: 'REG',
        maillesApplicables: [],
        météo: 'NON_RENSEIGNEE',
        nom: 'Indicateur 005',
        périmètreIds: [
          'PER-01',
        ],
        régionNom: 'Guadeloupe',
        valeurAvancement: 20,
        valeurCible: 11,
        valeurCibleAnnuelle: 22,
        valeurInitiale: 12,        chantierEcart: null,
        chantierTendance: null,
        chantierCibleAttendue: true,
        chantierAUnTauxAvancementDepartemental: true,
        chantierAUnePropositionValeurAvancement: false,
      }]);
    });
    it('chantierAUnePropositionValeurAvancement est faux au niveau national, si le chantier ne possède aucune proposition sur aucun territoire', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '02',
          territoire_code: 'DEPT-02',
          zone_id: 'D02',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'REG',
          code_insee: '84',
          territoire_code: 'REG-84',
          zone_id: 'R84',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          dernier_import_date_indic: new Date('2026-01-12'),
          type_id: 'IMPACT',
          unite_mesure: 'kg',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          code_insee: 'FR',
          zone_id: 'FRANCE',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          code_insee: '01',
          zone_id: 'D01',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-02',
          code_insee: '02',
          zone_id: 'D02',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'REG',
          territoire_code: 'REG-84',
          code_insee: '84',
          zone_id: 'D84',
        }],
      });

      // When 
      const result = await prismaIndicateurRepository.récupérerPourExports('CH-001', ['NAT-FR'], 2025);

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].chantierAUnePropositionValeurAvancement).toBeFalse();
    });
    it('chantierAUnePropositionValeurAvancement est vrai au niveau national, si le chantier possède au moins une proposition sur un territoire', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          nombre_propositions_valeur_actuelle: 1,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '02',
          territoire_code: 'DEPT-02',
          zone_id: 'D02',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'REG',
          code_insee: '84',
          territoire_code: 'REG-84',
          zone_id: 'R84',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          dernier_import_date_indic: new Date('2026-01-12'),
          type_id: 'IMPACT',
          unite_mesure: 'kg',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          code_insee: 'FR',
          zone_id: 'FRANCE',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          code_insee: '01',
          zone_id: 'D01',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-02',
          code_insee: '02',
          zone_id: 'D02',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'REG',
          territoire_code: 'REG-84',
          code_insee: '84',
          zone_id: 'D84',
        }],
      });

      // When 
      const result = await prismaIndicateurRepository.récupérerPourExports('CH-001', ['NAT-FR'], 2025);

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].chantierAUnePropositionValeurAvancement).toBeTrue();
    });
    it('chantierAUnePropositionValeurAvancement est vrai au niveau regional, si le chantier possède une proposition sur la région', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '02',
          territoire_code: 'DEPT-02',
          zone_id: 'D02',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'REG',
          code_insee: '84',
          territoire_code: 'REG-84',
          zone_id: 'R84',
          nombre_propositions_valeur_actuelle: 1,
          est_applicable: true,
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          dernier_import_date_indic: new Date('2026-01-12'),
          type_id: 'IMPACT',
          unite_mesure: 'kg',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          code_insee: 'FR',
          zone_id: 'FRANCE',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          code_insee: '01',
          zone_id: 'D01',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-02',
          code_insee: '02',
          zone_id: 'D02',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'REG',
          territoire_code: 'REG-84',
          code_insee: '84',
          zone_id: 'D84',
        }],
      });

      // When 
      const result = await prismaIndicateurRepository.récupérerPourExports('CH-001', ['REG-84'], 2025);

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].chantierAUnePropositionValeurAvancement).toBeTrue();
    });
    it('chantierAUnePropositionValeurAvancement est vrai au niveau regional, si le chantier possède une proposition sur un département enfant', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          nombre_propositions_valeur_actuelle: 1,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '02',
          territoire_code: 'DEPT-02',
          zone_id: 'D02',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'REG',
          code_insee: '84',
          territoire_code: 'REG-84',
          zone_id: 'R84',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          dernier_import_date_indic: new Date('2026-01-12'),
          type_id: 'IMPACT',
          unite_mesure: 'kg',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          code_insee: 'FR',
          zone_id: 'FRANCE',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          code_insee: '01',
          zone_id: 'D01',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-02',
          code_insee: '02',
          zone_id: 'D02',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'REG',
          territoire_code: 'REG-84',
          code_insee: '84',
          zone_id: 'D84',
        }],
      });

      // When 
      const result = await prismaIndicateurRepository.récupérerPourExports('CH-001', ['REG-84'], 2025);

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].chantierAUnePropositionValeurAvancement).toBeTrue();
    });
    it('chantierAUnePropositionValeurAvancement est faux au niveau regional, si le chantier ne possède aucune proposition sur la région ou sur un département enfant', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '02',
          territoire_code: 'DEPT-02',
          zone_id: 'D02',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'REG',
          code_insee: '84',
          territoire_code: 'REG-84',
          zone_id: 'R84',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          dernier_import_date_indic: new Date('2026-01-12'),
          type_id: 'IMPACT',
          unite_mesure: 'kg',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          code_insee: 'FR',
          zone_id: 'FRANCE',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          code_insee: '01',
          zone_id: 'D01',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-02',
          code_insee: '02',
          zone_id: 'D02',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'REG',
          territoire_code: 'REG-84',
          code_insee: '84',
          zone_id: 'D84',
        }],
      });

      // When 
      const result = await prismaIndicateurRepository.récupérerPourExports('CH-001', ['REG-84'], 2025);

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].chantierAUnePropositionValeurAvancement).toBeFalse();
    });
    it('chantierAUnePropositionValeurAvancement est vrai au niveau departemental, si le chantier possède une proposition sur le département', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          nombre_propositions_valeur_actuelle: 1,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '02',
          territoire_code: 'DEPT-02',
          zone_id: 'D02',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'REG',
          code_insee: '84',
          territoire_code: 'REG-84',
          zone_id: 'R84',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          dernier_import_date_indic: new Date('2026-01-12'),
          type_id: 'IMPACT',
          unite_mesure: 'kg',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          code_insee: 'FR',
          zone_id: 'FRANCE',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          code_insee: '01',
          zone_id: 'D01',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-02',
          code_insee: '02',
          zone_id: 'D02',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'REG',
          territoire_code: 'REG-84',
          code_insee: '84',
          zone_id: 'D84',
        }],
      });

      // When 
      const result = await prismaIndicateurRepository.récupérerPourExports('CH-001', ['DEPT-01'], 2025);

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].chantierAUnePropositionValeurAvancement).toBeTrue();
    });
    it('chantierAUnePropositionValeurAvancement est faux au niveau departemental, si le chantier ne possède pas de proposition sur le département', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '02',
          territoire_code: 'DEPT-02',
          zone_id: 'D02',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'REG',
          code_insee: '84',
          territoire_code: 'REG-84',
          zone_id: 'R84',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          dernier_import_date_indic: new Date('2026-01-12'),
          type_id: 'IMPACT',
          unite_mesure: 'kg',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          code_insee: 'FR',
          zone_id: 'FRANCE',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          code_insee: '01',
          zone_id: 'D01',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-02',
          code_insee: '02',
          zone_id: 'D02',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'REG',
          territoire_code: 'REG-84',
          code_insee: '84',
          zone_id: 'D84',
        }],
      });

      // When 
      const result = await prismaIndicateurRepository.récupérerPourExports('CH-001', ['DEPT-01'], 2025);

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].chantierAUnePropositionValeurAvancement).toBeFalse();
    });
    it('aUnTauxAvancementDepartemental est vrai, si le chantier ne possède aucun département applicable', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: false,
          taux_avancement_mandat: null,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '02',
          territoire_code: 'DEPT-02',
          zone_id: 'D02',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: false,
          taux_avancement_mandat: null,
        }, {
          id: 'CH-001',
          maille: 'REG',
          code_insee: '84',
          territoire_code: 'REG-84',
          zone_id: 'R84',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          dernier_import_date_indic: new Date('2026-01-12'),
          type_id: 'IMPACT',
          unite_mesure: 'kg',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          code_insee: 'FR',
          zone_id: 'FRANCE',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          code_insee: '01',
          zone_id: 'D01',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-02',
          code_insee: '02',
          zone_id: 'D02',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'REG',
          territoire_code: 'REG-84',
          code_insee: '84',
          zone_id: 'D84',
        }],
      });

      // When 
      const result = await prismaIndicateurRepository.récupérerPourExports('CH-001', ['NAT-FR'], 2025);

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].chantierAUnTauxAvancementDepartemental).toBeTrue();
    });
    it("aUnTauxAvancementDepartemental est vrai, si le chantier possède au moins un département avec un taux d'avancement non null", async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
          taux_avancement_mandat: 10,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '02',
          territoire_code: 'DEPT-02',
          zone_id: 'D02',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
          taux_avancement_mandat: null,
        }, {
          id: 'CH-001',
          maille: 'REG',
          code_insee: '84',
          territoire_code: 'REG-84',
          zone_id: 'R84',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          dernier_import_date_indic: new Date('2026-01-12'),
          type_id: 'IMPACT',
          unite_mesure: 'kg',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          code_insee: 'FR',
          zone_id: 'FRANCE',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          code_insee: '01',
          zone_id: 'D01',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-02',
          code_insee: '02',
          zone_id: 'D02',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'REG',
          territoire_code: 'REG-84',
          code_insee: '84',
          zone_id: 'D84',
        }],
      });

      // When 
      const result = await prismaIndicateurRepository.récupérerPourExports('CH-001', ['NAT-FR'], 2025);

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].chantierAUnTauxAvancementDepartemental).toBeTrue();
    });
    it("aUnTauxAvancementDepartemental est faux, si le chantier ne possède aucun département avec un taux d'avancement non null", async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
          taux_avancement_mandat: null,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '02',
          territoire_code: 'DEPT-02',
          zone_id: 'D02',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
          taux_avancement_mandat: null,
        }, {
          id: 'CH-001',
          maille: 'REG',
          code_insee: '84',
          territoire_code: 'REG-84',
          zone_id: 'R84',
          nombre_propositions_valeur_actuelle: 0,
          est_applicable: true,
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          dernier_import_date_indic: new Date('2026-01-12'),
          type_id: 'IMPACT',
          unite_mesure: 'kg',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          code_insee: 'FR',
          zone_id: 'FRANCE',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          code_insee: '01',
          zone_id: 'D01',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-02',
          code_insee: '02',
          zone_id: 'D02',
        }, {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'REG',
          territoire_code: 'REG-84',
          code_insee: '84',
          zone_id: 'D84',
        }],
      });

      // When 
      const result = await prismaIndicateurRepository.récupérerPourExports('CH-001', ['NAT-FR'], 2025);

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].chantierAUnTauxAvancementDepartemental).toBeFalse();
    });
  });
});
