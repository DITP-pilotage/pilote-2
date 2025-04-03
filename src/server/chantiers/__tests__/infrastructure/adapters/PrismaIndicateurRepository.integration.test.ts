
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPilote } from '@/server/db/PrismaPilote';
import { PrismaIndicateurRepository } from '@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository';
import { Utilisateur } from '@/server/gestion-utilisateur/domain/Utilisateur';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

describe('PrismaIndicateurRepository', () => {
  let prismaIndicateurRepository: PrismaIndicateurRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    const prismaPilote = new PrismaPilote();
    prisma = prismaPilote.getInstance();
    prismaIndicateurRepository = new PrismaIndicateurRepository({ prisma: prismaPilote });
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
      expect(listeDonneesIndicateurs[0].valeurActuelle).toEqual(25);
      expect(listeDonneesIndicateurs[0].dateValeurActuelle?.toISOString()).toStartWith('2025-12-06');
      expect(listeDonneesIndicateurs[1].indicId).toEqual('IND-001');
      expect(listeDonneesIndicateurs[1].territoireCode).toEqual('REG-01');
      expect(listeDonneesIndicateurs[1].valeurActuelle).toEqual(30);
      expect(listeDonneesIndicateurs[1].dateValeurActuelle?.toISOString()).toStartWith('2025-12-06');
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
      expect(listeDonneesIndicateurs[0].valeurActuelle).toEqual(20);
      expect(listeDonneesIndicateurs[0].dateValeurActuelle?.toISOString()).toStartWith('2024-12-06');
      expect(listeDonneesIndicateurs[1].indicId).toEqual('IND-001');
      expect(listeDonneesIndicateurs[1].territoireCode).toEqual('REG-01');
      expect(listeDonneesIndicateurs[1].valeurActuelle).toEqual(null);
      expect(listeDonneesIndicateurs[1].dateValeurActuelle).toEqual(null);
    });
  });

  describe('#supprimerPropositionValeurActuelle', () => {
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
      await prismaIndicateurRepository.supprimerPropositionValeurActuelle({ indicId, territoireCode: 'NAT-FR', auteurModification: 'Jane Doe' });

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
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
          ministeres: ['MINA'],
          ministeres_acronymes: ['MINA'],
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
          ministeres: ['MINA'],
          ministeres_acronymes: ['MINA'],
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
        }, {
          id: 'CH-001',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          est_applicable: true,
          taux_avancement_mandat: 23,
          meteo: 'SOLEIL',
        }, {
          id: 'CH-001',
          code_insee: '02',
          maille: 'DEPT',
          zone_id: 'D02',
          territoire_code: 'DEPT-02',
          est_applicable: true,
        }, {
          id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
          est_applicable: true,
        }, {
          id: 'CH-002',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          est_applicable: true,
        }, {
          id: 'CH-002',
          code_insee: '87',
          maille: 'DEPT',
          zone_id: 'D87',
          territoire_code: 'DEPT-87',
          est_applicable: true,
        },  {
          id: 'CH-002',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
          est_applicable: true,
        }, {
          id: 'CH-003',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
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
        valeurActuelle: 10,
        dateValeurActuelle: new Date('2024-01-13').toISOString(),
        valeurCibleAnnuelle: 22,
        dateValeurCibleAnnuelle: new Date('2024-12-06').toISOString(),
        avancementAnnuel: 13,
        valeurCible: 11,
        dateValeurCible: new Date('2025-01-13').toISOString(),
        avancementGlobal: 13,
        estApplicable: true,
        maillesApplicables: [],
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
        valeurActuelle: 10,
        dateValeurActuelle: new Date('2024-01-13').toISOString(),
        valeurCibleAnnuelle: 22,
        dateValeurCibleAnnuelle: new Date('2024-12-06').toISOString(),
        avancementAnnuel: 13,
        valeurCible: 11,
        dateValeurCible: new Date('2025-01-13').toISOString(),
        avancementGlobal: null,
        estApplicable: true,
        maillesApplicables: [],
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
        valeurActuelle: 10,
        dateValeurActuelle: new Date('2024-01-13').toISOString(),
        valeurCibleAnnuelle: 22,
        dateValeurCibleAnnuelle: new Date('2024-12-06').toISOString(),
        avancementAnnuel: 13,
        valeurCible: 11,
        dateValeurCible: new Date('2025-01-13').toISOString(),
        avancementGlobal: 13,
        estApplicable: true,
        maillesApplicables: [],
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
        dateValeurActuelle: '2024-03-13T00:00:00.000Z',
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
        valeurActuelle: 20,
        valeurCible: 11,
        valeurCibleAnnuelle: 22,
        valeurInitiale: 12,
      }]);
    });
  });

  describe('#récupérerChantierIdAssocié', () => {
    it("doit récupérer l'id de chantier de l'indicateur passé en paramètre", async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
        }, {
          id: 'IND-002',
          nom: 'Indicateur 002',
          chantier_id: 'CH-002',
        }],
      });

      // When
      const result = await prismaIndicateurRepository.récupérerChantierIdAssocié('IND-001');
      // Then
      expect(result).toEqual('CH-001');
    });
  });

  describe('#récupérerDétailsTerritoirePourUnIndicateur', () => {
    it("doit récupérer l'id de chantier de l'indicateur passé en paramètre", async () => {
      // Given
      const habilitations = { lecture: {
        chantiers: ['CH-001', 'CH-002'],
        territoires: ['DEPT-01'],
      } } as unknown as Utilisateur['habilitations'];

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }],
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
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'CH-002',
          code_insee: '87',
          maille: 'DEPT',
          zone_id: 'D87',
          territoire_code: 'DEPT-87',
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          dernier_import_date_indic: new Date('2026-01-12'),
          unite_mesure: 'kg',
        }, {
          id: 'IND-002',
          nom: 'Indicateur 002',
          chantier_id: 'CH-002',
          dernier_import_date_indic: new Date('2026-01-13'),
          unite_mesure: 'mg',
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
          ponderation_zone_reel: 20,
          date_valeur_actuelle_mandat: new Date('2025-01-12'),
          date_valeur_cible_mandat: new Date('2025-01-12'),
          date_valeur_initiale: new Date('2025-01-12'),
          est_a_jour: true,
          est_applicable: false,
          evolution_valeur_actuelle: [{ date: new Date('2025-06-12') }] as unknown as Prisma.JsonArray,
          prochaine_date_maj_jours: 47,
          prochaine_date_maj: new Date('2025-06-31'),
          prochaine_date_valeur_actuelle: new Date('2025-07-31'),
          tendance: 'BAISSE',
          valeur_actuelle_mandat: 20,
        }, {
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
          date_valeur_actuelle: new Date('2024-01-12'),
          valeur_actuelle: 20,
        }, {
          id: 'IND-001',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          valeur_cible: 24,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          jalon: 2025,
          date_valeur_actuelle: new Date('2025-01-13'),
          valeur_actuelle: 20,
          taux_avancement_proposition: 12,
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
          taux_avancement_proposition: 12,
        }],
      });

      const jalon = 2025;

      // When
      const result = await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur('IND-001', habilitations, ProfilEnum.DITP_ADMIN, jalon);

      // Then
      expect(result).toMatchObject({
        'DEPT-01': {
          avancement: {
            annuel: 13,
            global: null,
          },
          codeInsee: '01',
          dateImport: new Date('2026-01-12').toLocaleString(),
          dateValeurActuelle: new Date('2025-01-13').toLocaleString(),
          dateValeurCible: new Date('2025-01-13').toLocaleString(),
          dateValeurCibleAnnuelle: new Date('2025-12-06').toLocaleString(),
          dateValeurInitiale: new Date('2025-01-13').toLocaleString(),
          estAJour: false,
          est_applicable: true,
          historiquesValeurs: [{
            date: new Date('2024-06-12').toISOString(),
          }],
          pondération: 22,
          prochaineDateMaj: new Date('2025-08-31').toLocaleString(),
          prochaineDateMajJours: 50,
          prochaineDateValeurActuelle: new Date('2025-09-31').toLocaleString(),
          proposition: {
            valeurActuelle: 10,
            tauxAvancement: 11,
            tauxAvancementIntermediaire: 12,
            auteur: 'John Doe',
            motif: 'Pendant un test',
            sourceDonneeEtMethodeCalcul: 'test integ',
            dateProposition: new Date('2025-02-06').toLocaleString(),
          },
          tendance: 'HAUSSE',
          unité: 'kg',
          valeurActuelle: 20,
          valeurCible: 11,
          valeurCibleAnnuelle: 24,
          valeurInitiale: 12,
        },
      });
    });
  });

  describe('#récupérerGroupésParChantier', () => {
    it('doit récupérer les détails des indicateurs regroupé par chantier', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }],
      });
      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          type_id: 'IMPACT',
          est_barometre: true,
          description: 'Indicateur 1 chantier 1',
          source: 'Une source indic 1',
          mode_de_calcul: 'Un mode indic 1',
          unite_mesure: 'mg',
          parent_id: null,
          periodicite: '10 jours',
          delai_disponibilite: 10,
          responsables_donnees_mails: ['john.doe@pilote.fr'],
        }, {
          id: 'IND-002',
          nom: 'Indicateur 002',
          chantier_id: 'CH-002',
          type_id: 'IMPACT',
          est_barometre: false,
          description: 'Indicateur 2 chantier 2',
          source: 'Une source indic 2',
          mode_de_calcul: 'Un mode indic 2',
          unite_mesure: 'kg',
          parent_id: 'IND-001',
          periodicite: null,
          delai_disponibilite: null,
          responsables_donnees_mails: ['jane.doe@pilote.fr'],
        }, {
          id: 'IND-003',
          nom: 'Indicateur 003',
          chantier_id: 'CH-002',
          type_id: null,
          est_barometre: true,
          description: 'Indicateur 3 chantier 2',
          source: 'Une source indic 3',
          mode_de_calcul: 'Un mode indic 3',
          unite_mesure: 'kg',
          parent_id: null,
          periodicite: null,
          delai_disponibilite: null,
          responsables_donnees_mails: ['john.doe@pilote.fr'],
        }],
      });
      // When
      const result = await prismaIndicateurRepository.récupérerGroupésParChantier(['CH-001', 'CH-002']);

      // Then
      expect(result).toMatchObject({
        'CH-001': [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          type: 'IMPACT',
          estIndicateurDuBaromètre: true,
          description: 'Indicateur 1 chantier 1',
          source: 'Une source indic 1',
          modeDeCalcul: 'Un mode indic 1',
          unité: 'mg',
          parentId: null,
          periodicite: '10 jours',
          delaiDisponibilite: '10',
          responsablesDonneesMails: ['john.doe@pilote.fr'],
        }],
        'CH-002': [{
          id: 'IND-002',
          nom: 'Indicateur 002',
          type: 'IMPACT',
          estIndicateurDuBaromètre: false,
          description: 'Indicateur 2 chantier 2',
          source: 'Une source indic 2',
          modeDeCalcul: 'Un mode indic 2',
          unité: 'kg',
          parentId: 'IND-001',
          periodicite: 'Non renseignée',
          delaiDisponibilite: 'Non renseignée',
          responsablesDonneesMails: ['jane.doe@pilote.fr'],
        }],
      });
    });
  });

  describe('#récupérerDétailsGroupésParChantierEtParIndicateur', () => {
    it('doit récupérer les détails des indicateurs groupés par chantier et par indicateur', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
        }],
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
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'CH-002',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'CH-002',
          code_insee: '87',
          maille: 'DEPT',
          zone_id: 'D87',
          territoire_code: 'DEPT-87',
        },  {
          id: 'CH-002',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
        }, {
          id: 'CH-003',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
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
        }, {
          id: 'IND-002',
          chantier_id: 'CH-002',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
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
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
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
          jalon: 2025,
          date_valeur_actuelle: new Date('2025-01-13'),
          valeur_actuelle: 10,
          taux_avancement_proposition: 12,
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
          date_valeur_actuelle: new Date('2025-01-13'),
          valeur_actuelle: 10,
          taux_avancement_proposition: 12,

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
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          valeur_cible: 22,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          jalon: 2025,
          taux_avancement_proposition: 12,
          date_valeur_actuelle: new Date('2025-01-13'),
          valeur_actuelle: 10,
        }],
      });

      const jalon = 2025;

      // When
      const result = await prismaIndicateurRepository.récupérerDétailsGroupésParChantierEtParIndicateur(['CH-001', 'CH-002'], 'departementale', '01', jalon);

      // Then
      expect(result).toMatchObject({
        'CH-001': {
          'IND-001': {
            'DEPT-01': {
              avancement: {
                annuel: 13,
                global: null,
              },
              codeInsee: '01',
              dateImport: new Date('2026-01-12').toISOString(),
              dateValeurActuelle: new Date('2025-01-13').toISOString(),
              dateValeurCible: new Date('2025-01-13').toISOString(),
              dateValeurCibleAnnuelle: new Date('2025-12-06').toISOString(),
              dateValeurInitiale: new Date('2025-01-13').toISOString(),
              estAJour: false,
              est_applicable: true,
              historiquesValeurs: [{
                date: new Date('2024-06-12').toISOString(),
              }],
              pondération: 22,
              prochaineDateMaj: new Date('2025-08-31').toISOString(),
              prochaineDateMajJours: 50,
              prochaineDateValeurActuelle: new Date('2025-09-31').toISOString(),
              proposition: {
                valeurActuelle: 10,
                tauxAvancement: 11,
                tauxAvancementIntermediaire: 12,
                auteur: 'John Doe',
                motif: 'Pendant un test',
                sourceDonneeEtMethodeCalcul: 'test integ',
                dateProposition: new Date('2025-02-06').toISOString(),
              },
              tendance: 'HAUSSE',
              unité: 'kg',
              valeurActuelle: 10,
              valeurCible: 11,
              valeurCibleAnnuelle: 24,
              valeurInitiale: 12,
            },
          },
          'IND-005': {
            'DEPT-01': {
              avancement: {
                annuel: 13,
                global: null,
              },
              codeInsee: '01',
              dateImport: null,
              dateValeurActuelle: new Date('2025-01-13').toISOString(),
              dateValeurCible: new Date('2025-01-13').toISOString(),
              dateValeurCibleAnnuelle: new Date('2025-12-06').toISOString(),
              dateValeurInitiale: new Date('2025-01-13').toISOString(),
              estAJour: false,
              est_applicable: true,
              historiquesValeurs: [{
                date: new Date('2024-06-12').toISOString(),
              }],
              pondération: null,
              prochaineDateMaj: new Date('2025-08-31').toISOString(),
              prochaineDateMajJours: 50,
              prochaineDateValeurActuelle: new Date('2025-09-31').toISOString(),
              proposition: {
                valeurActuelle: 10,
                tauxAvancement: 11,
                tauxAvancementIntermediaire: 12,
                auteur: 'John Doe',
                motif: 'Pendant un test',
                sourceDonneeEtMethodeCalcul: 'test integ',
                dateProposition: new Date('2025-02-06').toISOString(),
              },
              tendance: 'HAUSSE',
              unité: null,
              valeurActuelle: 10,
              valeurCible: 11,
              valeurCibleAnnuelle: 22,
              valeurInitiale: 12,
            },
          },
        },
        'CH-002': {
          'IND-002': {
            'DEPT-01': {
              avancement: {
                annuel: 13,
                global: null,
              },
              codeInsee: '01',
              dateImport: new Date('2026-01-13').toISOString(),
              dateValeurActuelle: new Date('2025-01-13').toISOString(),
              dateValeurCible: new Date('2025-01-13').toISOString(),
              dateValeurCibleAnnuelle: new Date('2025-12-06').toISOString(),
              dateValeurInitiale: new Date('2025-01-13').toISOString(),
              estAJour: false,
              est_applicable: true,
              historiquesValeurs: [{
                date: new Date('2024-06-12').toISOString(),
              }],
              pondération: null,
              prochaineDateMaj: new Date('2025-08-31').toISOString(),
              prochaineDateMajJours: 50,
              prochaineDateValeurActuelle: new Date('2025-09-31').toISOString(),
              proposition: {
                valeurActuelle: 10,
                tauxAvancement: 11,
                tauxAvancementIntermediaire: 12,
                auteur: 'John Doe',
                motif: 'Pendant un test',
                sourceDonneeEtMethodeCalcul: 'test integ',
                dateProposition: new Date('2025-02-06').toISOString(),
              },
              tendance: 'HAUSSE',
              unité: 'mg',
              valeurActuelle: 10,
              valeurCible: 11,
              valeurCibleAnnuelle: 24,
              valeurInitiale: 12,
            },
          },
        },
      });
    });
  });

  describe('#récupérerParChantierId', () => {
    it('doit récupérer les détails des indicateurs regroupé par chantier', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }],
      });
      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
          type_id: 'IMPACT',
          est_barometre: true,
          description: 'Indicateur 1 chantier 1',
          source: 'Une source indic 1',
          mode_de_calcul: 'Un mode indic 1',
          unite_mesure: 'mg',
          parent_id: null,
          periodicite: '10 jours',
          delai_disponibilite: 10,
          responsables_donnees_mails: ['john.doe@pilote.fr'],
        }, {
          id: 'IND-002',
          nom: 'Indicateur 002',
          chantier_id: 'CH-002',
          type_id: 'IMPACT',
          est_barometre: false,
          description: 'Indicateur 2 chantier 2',
          source: 'Une source indic 2',
          mode_de_calcul: 'Un mode indic 2',
          unite_mesure: 'kg',
          parent_id: 'IND-001',
          periodicite: null,
          delai_disponibilite: null,
          responsables_donnees_mails: ['jane.doe@pilote.fr'],
        }, {
          id: 'IND-003',
          nom: 'Indicateur 003',
          chantier_id: 'CH-002',
          type_id: null,
          est_barometre: true,
          description: 'Indicateur 3 chantier 2',
          source: 'Une source indic 3',
          mode_de_calcul: 'Un mode indic 3',
          unite_mesure: 'kg',
          parent_id: null,
          periodicite: null,
          delai_disponibilite: null,
          responsables_donnees_mails: ['john.doe@pilote.fr'],
        }, {
          id: 'IND-004',
          nom: 'Indicateur 004',
          chantier_id: 'CH-001',
          type_id: 'IMPACT',
          est_barometre: true,
          description: 'Indicateur 4 chantier 1',
          source: 'Une source indic 4',
          mode_de_calcul: 'Un mode indic 4',
          unite_mesure: 'mg',
          parent_id: null,
          periodicite: '10 jours',
          delai_disponibilite: 10,
          responsables_donnees_mails: ['john.doe@pilote.fr'],
        }],
      });
      // When
      const result = await prismaIndicateurRepository.récupérerParChantierId('CH-001');

      // Then
      expect(result).toMatchObject([{
        id: 'IND-001',
        nom: 'Indicateur 001',
        type: 'IMPACT',
        estIndicateurDuBaromètre: true,
        description: 'Indicateur 1 chantier 1',
        source: 'Une source indic 1',
        modeDeCalcul: 'Un mode indic 1',
        unité: 'mg',
        parentId: null,
        periodicite: '10 jours',
        delaiDisponibilite: '10',
        responsablesDonneesMails: ['john.doe@pilote.fr'],
      }, {
        id: 'IND-004',
        nom: 'Indicateur 004',
        type: 'IMPACT',
        estIndicateurDuBaromètre: true,
        description: 'Indicateur 4 chantier 1',
        source: 'Une source indic 4',
        modeDeCalcul: 'Un mode indic 4',
        unité: 'mg',
        parentId: null,
        periodicite: '10 jours',
        delaiDisponibilite: '10',
        responsablesDonneesMails: ['john.doe@pilote.fr'],
      }]);
    });
  });

  describe('#récupérerDétailsParIndicIdEtMaille', () => {
    it('doit récupérer les détails des indicateurs filtrés par indic et par maille', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
        }],
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
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'CH-001',
          code_insee: '02',
          maille: 'DEPT',
          zone_id: 'D02',
          territoire_code: 'DEPT-02',
        }, {
          id: 'CH-002',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'CH-002',
          code_insee: '87',
          maille: 'DEPT',
          zone_id: 'D87',
          territoire_code: 'DEPT-87',
        },  {
          id: 'CH-002',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
        }, {
          id: 'CH-003',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
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
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
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
          jalon: 2025,
          date_valeur_actuelle: new Date('2025-01-13'),
          valeur_actuelle: 10,
          taux_avancement_proposition: 12,
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
        }, {
          id: 'IND-001',
          code_insee: '02',
          maille: 'DEPT',
          zone_id: 'D02',
          territoire_code: 'DEPT-02',
          valeur_cible: 22,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          jalon: 2025,
          taux_avancement_proposition: 12,
          date_valeur_actuelle: new Date('2025-01-13'),
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
        }],
      });

      const jalon = 2025;

      // When
      const result = await prismaIndicateurRepository.récupérerDétailsParIndicIdEtMaille('IND-001', 'departementale', jalon);

      // Then
      expect(result).toMatchObject({
        'IND-001': {
          'DEPT-01': {
            avancement: {
              annuel: 13,
              global: null,
            },
            codeInsee: '01',
            dateImport: new Date('2026-01-12').toISOString(),
            dateValeurActuelle: new Date('2025-01-13').toISOString(),
            dateValeurCible: new Date('2025-01-13').toISOString(),
            dateValeurCibleAnnuelle: new Date('2025-12-06').toISOString(),
            dateValeurInitiale: new Date('2025-01-13').toISOString(),
            estAJour: false,
            est_applicable: true,
            historiquesValeurs: [{
              date: new Date('2024-06-12').toISOString(),
            }],
            pondération: 22,
            prochaineDateMaj: new Date('2025-08-31').toISOString(),
            prochaineDateMajJours: 50,
            prochaineDateValeurActuelle: new Date('2025-09-31').toISOString(),
            proposition: {
              valeurActuelle: 10,
              tauxAvancement: 11,
              tauxAvancementIntermediaire: 12,
              auteur: 'John Doe',
              motif: 'Pendant un test',
              sourceDonneeEtMethodeCalcul: 'test integ',
              dateProposition: new Date('2025-02-06').toISOString(),
            },
            tendance: 'HAUSSE',
            unité: 'kg',
            valeurActuelle: 10,
            valeurCible: 11,
            valeurCibleAnnuelle: 24,
            valeurInitiale: 12,
          },
          'DEPT-02': {
            avancement: {
              annuel: 13,
              global: null,
            },
            codeInsee: '02',
            dateImport: new Date('2026-01-12').toISOString(),
            dateValeurActuelle: new Date('2025-01-13').toISOString(),
            dateValeurCible: new Date('2025-01-13').toISOString(),
            dateValeurCibleAnnuelle: new Date('2025-12-06').toISOString(),
            dateValeurInitiale: new Date('2025-01-13').toISOString(),
            estAJour: false,
            est_applicable: true,
            historiquesValeurs: [{
              date: new Date('2024-06-12').toISOString(),
            }],
            pondération: null,
            prochaineDateMaj: new Date('2025-08-31').toISOString(),
            prochaineDateMajJours: 50,
            prochaineDateValeurActuelle: new Date('2025-09-31').toISOString(),
            proposition: {
              valeurActuelle: 10,
              tauxAvancement: 11,
              tauxAvancementIntermediaire: 12,
              auteur: 'John Doe',
              motif: 'Pendant un test',
              sourceDonneeEtMethodeCalcul: 'test integ',
              dateProposition: new Date('2025-02-06').toISOString(),
            },
            tendance: 'HAUSSE',
            unité: 'kg',
            valeurActuelle: 10,
            valeurCible: 11,
            valeurCibleAnnuelle: 22,
            valeurInitiale: 12,
          },
        },
      });
    });
  });

  describe('#récupererDétailsParChantierIdEtTerritoire', () => {
    it('doit récupérer les détails des indicateurs filtrés par chantier et par territoire', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
        }],
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
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'CH-001',
          code_insee: '02',
          maille: 'DEPT',
          zone_id: 'D02',
          territoire_code: 'DEPT-02',
        }, {
          id: 'CH-002',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'CH-002',
          code_insee: '87',
          maille: 'DEPT',
          zone_id: 'D87',
          territoire_code: 'DEPT-87',
        },  {
          id: 'CH-002',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
        }, {
          id: 'CH-003',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
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
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
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
          jalon: 2025,
          date_valeur_actuelle: new Date('2025-01-13'),
          valeur_actuelle: 10,
          taux_avancement_proposition: 12,
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
        }, {
          id: 'IND-001',
          code_insee: '02',
          maille: 'DEPT',
          zone_id: 'D02',
          territoire_code: 'DEPT-02',
          valeur_cible: 22,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          jalon: 2025,
          date_valeur_actuelle: new Date('2025-01-13'),
          valeur_actuelle: 10,
          taux_avancement_proposition: 12,
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
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          valeur_cible: 22,
          date_valeur_cible: new Date('2025-12-06'),
          taux_avancement: 13,
          jalon: 2025,
          date_valeur_actuelle: new Date('2025-01-13'),
          valeur_actuelle: 10,
          taux_avancement_proposition: 12,
        }],
      });

      const jalon = 2025;

      // When
      const result = await prismaIndicateurRepository.récupererDétailsParChantierIdEtTerritoire('CH-001', ['DEPT-01', 'DEPT-02'], jalon);

      // Then
      expect(result).toMatchObject({
        'IND-001': {
          'DEPT-01': {
            avancement: {
              annuel: 13,
              global: null,
            },
            codeInsee: '01',
            dateImport: new Date('2026-01-12').toISOString(),
            dateValeurActuelle: new Date('2025-01-13').toISOString(),
            dateValeurCible: new Date('2025-01-13').toISOString(),
            dateValeurCibleAnnuelle: new Date('2025-12-06').toISOString(),
            dateValeurInitiale: new Date('2025-01-13').toISOString(),
            estAJour: false,
            est_applicable: true,
            historiquesValeurs: [{
              date: new Date('2024-06-12').toISOString(),
            }],
            pondération: 22,
            prochaineDateMaj: new Date('2025-08-31').toISOString(),
            prochaineDateMajJours: 50,
            prochaineDateValeurActuelle: new Date('2025-09-31').toISOString(),
            proposition: {
              valeurActuelle: 10,
              tauxAvancement: 11,
              tauxAvancementIntermediaire: 12,
              auteur: 'John Doe',
              motif: 'Pendant un test',
              sourceDonneeEtMethodeCalcul: 'test integ',
              dateProposition: new Date('2025-02-06').toISOString(),
            },
            tendance: 'HAUSSE',
            unité: 'kg',
            valeurActuelle: 10,
            valeurCible: 11,
            valeurCibleAnnuelle: 24,
            valeurInitiale: 12,
          },
          'DEPT-02': {
            avancement: {
              annuel: 13,
              global: null,
            },
            codeInsee: '02',
            dateImport: new Date('2026-01-12').toISOString(),
            dateValeurActuelle: new Date('2025-01-13').toISOString(),
            dateValeurCible: new Date('2025-01-13').toISOString(),
            dateValeurCibleAnnuelle: new Date('2025-12-06').toISOString(),
            dateValeurInitiale: new Date('2025-01-13').toISOString(),
            estAJour: false,
            est_applicable: true,
            historiquesValeurs: [{
              date: new Date('2024-06-12').toISOString(),
            }],
            pondération: null,
            prochaineDateMaj: new Date('2025-08-31').toISOString(),
            prochaineDateMajJours: 50,
            prochaineDateValeurActuelle: new Date('2025-09-31').toISOString(),
            proposition: {
              valeurActuelle: 10,
              tauxAvancement: 11,
              tauxAvancementIntermediaire: 12,
              auteur: 'John Doe',
              motif: 'Pendant un test',
              sourceDonneeEtMethodeCalcul: 'test integ',
              dateProposition: new Date('2025-02-06').toISOString(),
            },
            tendance: 'HAUSSE',
            unité: 'kg',
            valeurActuelle: 10,
            valeurCible: 11,
            valeurCibleAnnuelle: 22,
            valeurInitiale: 12,
          },
        },
        'IND-005': {
          'DEPT-01': {
            avancement: {
              annuel: 13,
              global: null,
            },
            codeInsee: '01',
            dateImport: null,
            dateValeurActuelle: new Date('2025-01-13').toISOString(),
            dateValeurCible: new Date('2025-01-13').toISOString(),
            dateValeurCibleAnnuelle: new Date('2025-12-06').toISOString(),
            dateValeurInitiale: new Date('2025-01-13').toISOString(),
            estAJour: false,
            est_applicable: true,
            historiquesValeurs: [{
              date: new Date('2024-06-12').toISOString(),
            }],
            pondération: null,
            prochaineDateMaj: new Date('2025-08-31').toISOString(),
            prochaineDateMajJours: 50,
            prochaineDateValeurActuelle: new Date('2025-09-31').toISOString(),
            proposition: {
              valeurActuelle: 10,
              tauxAvancement: 11,
              tauxAvancementIntermediaire: 12,
              auteur: 'John Doe',
              motif: 'Pendant un test',
              sourceDonneeEtMethodeCalcul: 'test integ',
              dateProposition: new Date('2025-02-06').toISOString(),
            },
            tendance: 'HAUSSE',
            unité: null,
            valeurActuelle: 10,
            valeurCible: 11,
            valeurCibleAnnuelle: 22,
            valeurInitiale: 12,
          },
        },
      });
    });

    it('quand on a un jalon, doit récupérer les détails des indicateurs pour le jalon donné filtrés par chantier et par territoire', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
        }],
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
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'CH-001',
          code_insee: '02',
          maille: 'DEPT',
          zone_id: 'D02',
          territoire_code: 'DEPT-02',
        }, {
          id: 'CH-002',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'CH-002',
          code_insee: '87',
          maille: 'DEPT',
          zone_id: 'D87',
          territoire_code: 'DEPT-87',
        },  {
          id: 'CH-002',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
        }, {
          id: 'CH-003',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
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
          code_insee: '02',
          maille: 'DEPT',
          zone_id: 'D02',
          territoire_code: 'DEPT-02',
          valeur_actuelle_mandat: 10,
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
          valeur_cible_mandat: 11,
          taux_avancement_mandat: 30,
          valeur_initiale: 12,
        }, {
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
          taux_avancement_mandat: 20,
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
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
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
          taux_avancement_mandat: null,
          valeur_cible_mandat: 11,
          valeur_initiale: 12,
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
          taux_avancement: 15,
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
          valeur_actuelle: 20,
          date_valeur_actuelle: new Date('2025-12-06'),
          jalon: 2025,
        }, {
          id: 'IND-001',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
          valeur_cible: 22,
          date_valeur_cible: new Date('2024-12-06'),
          taux_avancement: 33,
          valeur_actuelle: 30,
          date_valeur_actuelle: new Date('2024-12-06'),
          taux_avancement_proposition: 21,
          jalon: 2024,
        }, {
          id: 'IND-001',
          code_insee: '02',
          maille: 'DEPT',
          zone_id: 'D02',
          territoire_code: 'DEPT-02',
          valeur_cible: 22,
          date_valeur_cible: new Date('2024-12-06'),
          taux_avancement: 53,
          jalon: 2024,
          valeur_actuelle: 30,
          date_valeur_actuelle: new Date('2024-12-06'),
          taux_avancement_proposition: 62,
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
          taux_avancement: 43,
          valeur_actuelle: 30,
          date_valeur_actuelle: new Date('2024-12-06'),
          jalon: 2024,
          taux_avancement_proposition: 21,
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
          valeur_actuelle: 30,
          date_valeur_actuelle: new Date('2024-12-06'),
          jalon: 2024,
          taux_avancement_proposition: 12,
        }],
      });

      // When
      const result = await prismaIndicateurRepository.récupererDétailsParChantierIdEtTerritoire('CH-001', ['DEPT-01', 'DEPT-02'], 2024);

      // Then
      expect(result).toMatchObject({
        'IND-001': {
          'DEPT-01': {
            avancement: {
              annuel: 33,
              global: 20,
            },
            codeInsee: '01',
            dateImport: new Date('2026-01-12').toISOString(),
            dateValeurActuelle: new Date('2024-12-06').toISOString(),
            dateValeurCible: new Date('2025-01-13').toISOString(),
            dateValeurCibleAnnuelle: new Date('2024-12-06').toISOString(),
            dateValeurInitiale: new Date('2025-01-13').toISOString(),
            dateValeurActuelleMandat: new Date('2025-01-13').toISOString(),
            valeurActuelleMandat: 10,
            valeurActuelle: 30,
            valeurCible: 11,
            valeurCibleAnnuelle: 22,
            valeurInitiale: 12,
            estAJour: false,
            est_applicable: true,
            historiquesValeurs: [{
              date: new Date('2024-06-12').toISOString(),
            }],
            pondération: 22,
            prochaineDateMaj: new Date('2025-08-31').toISOString(),
            prochaineDateMajJours: 50,
            prochaineDateValeurActuelle: new Date('2025-09-31').toISOString(),
            proposition: {
              valeurActuelle: 10,
              tauxAvancement: 11,
              tauxAvancementIntermediaire: 21,
              auteur: 'John Doe',
              motif: 'Pendant un test',
              sourceDonneeEtMethodeCalcul: 'test integ',
              dateProposition: new Date('2025-02-06').toISOString(),
            },
            tendance: 'HAUSSE',
            unité: 'kg',
          },
          'DEPT-02': {
            avancement: {
              annuel: 53,
              global: 30,
            },
            codeInsee: '02',
            dateImport: new Date('2026-01-12').toISOString(),
            dateValeurActuelle: new Date('2024-12-06').toISOString(),
            dateValeurCible: new Date('2025-01-13').toISOString(),
            dateValeurCibleAnnuelle: new Date('2024-12-06').toISOString(),
            dateValeurInitiale: new Date('2025-01-13').toISOString(),
            estAJour: false,
            est_applicable: true,
            historiquesValeurs: [{
              date: new Date('2024-06-12').toISOString(),
            }],
            pondération: null,
            prochaineDateMaj: new Date('2025-08-31').toISOString(),
            prochaineDateMajJours: 50,
            prochaineDateValeurActuelle: new Date('2025-09-31').toISOString(),
            proposition: {
              valeurActuelle: 10,
              tauxAvancement: 11,
              tauxAvancementIntermediaire: 62,
              auteur: 'John Doe',
              motif: 'Pendant un test',
              sourceDonneeEtMethodeCalcul: 'test integ',
              dateProposition: new Date('2025-02-06').toISOString(),
            },
            tendance: 'HAUSSE',
            unité: 'kg',
            valeurActuelle: 30,
            valeurCible: 11,
            valeurCibleAnnuelle: 22,
            valeurInitiale: 12,
          },
        },
        'IND-005': {
          'DEPT-01': {
            avancement: {
              annuel: null,
              global: null,
            },
            codeInsee: '01',
            dateImport: null,
            dateValeurActuelle: null,
            dateValeurCible: new Date('2025-01-13').toISOString(),
            dateValeurCibleAnnuelle: null,
            dateValeurInitiale: new Date('2025-01-13').toISOString(),
            estAJour: false,
            est_applicable: true,
            historiquesValeurs: [{
              date: new Date('2024-06-12').toISOString(),
            }],
            pondération: null,
            prochaineDateMaj: new Date('2025-08-31').toISOString(),
            prochaineDateMajJours: 50,
            prochaineDateValeurActuelle: new Date('2025-09-31').toISOString(),
            proposition: {
              valeurActuelle: 10,
              tauxAvancement: 11,
              tauxAvancementIntermediaire: null,
              auteur: 'John Doe',
              motif: 'Pendant un test',
              sourceDonneeEtMethodeCalcul: 'test integ',
              dateProposition: new Date('2025-02-06').toISOString(),
            },
            tendance: 'HAUSSE',
            unité: null,
            valeurActuelle: null,
            valeurCible: 11,
            valeurCibleAnnuelle: null,
            valeurInitiale: 12,
          },
        },
      });
    });
  });
  
  describe('#recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire', () => {
    it("doit récupérer l'id des indicateurs qui font partis de la liste des chantiers et qui ont une pondération supérieur à 0 sur au moins un territoire", async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }],
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
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'CH-002',
          code_insee: '87',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
        }],
      });
      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          nom: 'Indicateur 001',
          chantier_id: 'CH-001',
        }, {
          id: 'IND-002',
          nom: 'Indicateur 002',
          chantier_id: 'CH-002',
        }, {
          id: 'IND-003',
          nom: 'Indicateur 003',
          chantier_id: 'CH-001',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: 'IND-001',
            chantier_id: 'CH-001',
            territoire_code: 'NAT-FR',
            maille: 'NAT',
            code_insee: 'FR',
            zone_id: 'FRANCE',
            ponderation_zone_reel: 0,
          },
          {
            id: 'IND-002',
            chantier_id: 'CH-002',
            territoire_code: 'NAT-FR',
            maille: 'NAT',
            code_insee: 'FR',
            zone_id: 'FRANCE',
            ponderation_zone_reel: 10,
          },
          {
            id: 'IND-003',
            chantier_id: 'CH-001',
            territoire_code: 'NAT-FR',
            maille: 'NAT',
            code_insee: 'FR',
            zone_id: 'FRANCE',
            ponderation_zone_reel: 0,
          },
          {
            id: 'IND-003',
            chantier_id: 'CH-001',
            territoire_code: 'DEPT-01',
            maille: 'DEPT',
            code_insee: '01',
            zone_id: 'D01',
            ponderation_zone_reel: 10,
          },
        ],
      });

      // When
      const result = await prismaIndicateurRepository.recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire(['CH-001']);
      // Then
      expect(result).toEqual(['IND-003']);
    });
  });
});
