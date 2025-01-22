import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import {
  PrismaIndicateurRepository,
} from '@/server/fiche-conducteur/infrastructure/adapters/PrismaIndicateurRepository';
import {
  getAnneeAffichageDateDeBascule,
} from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getDateBasculeAffichageValeursAnneePrecedente';
import { configuration } from '@/config';

describe('PrismaIndicateurRepository', () => {
  let prismaIndicateurRepository: PrismaIndicateurRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new PrismaIndicateurRepository(prisma);
  });
  describe('#récupérerIndicImpactParChantierId', () => {
    it('doit récupérer les indicateurs d\'impact avec une pondération national supérieur à 0 du chantier associé', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          est_territorialise: true,
          directeurs_administration_centrale: ['DAC 1', 'DAC 2'],
          directeurs_projet: ['DP 1', 'DP 2'],
        }],
      });
      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          zone_id: 'FRANCE',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
        }, {
          id: 'CH-001',
          zone_id: 'D01',
          code_insee: '01',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
        }],
      });

      await prisma.indicateur_identite.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          nom: 'Indicateur 001',
          type_id: 'IMPACT',
        }, {
          id: 'IND-002',
          chantier_id: 'CH-001',
          nom: 'Indicateur 002',
          type_id: 'IMPACT',
        }, {
          id: 'IND-003',
          chantier_id: 'CH-001',
          nom: 'Indicateur 003',
          type_id: 'IMPACT',
        }, {
          id: 'IND-004',
          chantier_id: 'CH-001',
          nom: 'Indicateur 004',
          type_id: 'Q_SERV',
        }, {
          id: 'IND-005',
          chantier_id: 'CH-001',
          nom: 'Indicateur 005',
          type_id: 'IMPACT',
        }, {
          id: 'IND-006',
          chantier_id: 'CH-001',
          nom: 'Indicateur 006',
          type_id: 'Q_SERV',
        }],
      });

      await prisma.indicateur_territoire.createMany({
        data: [{
          id: 'IND-001',
          chantier_id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          ponderation_zone_reel: 20,
          valeur_cible_mandat: 10,
          taux_avancement_mandat: 30,
        }, {
          id: 'IND-002',
          chantier_id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          ponderation_zone_reel: 20,
          valeur_cible_mandat: 11,
          taux_avancement_mandat: 31,
        }, {
          id: 'IND-003',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          ponderation_zone_reel: 20,
          valeur_cible_mandat: 12,
          taux_avancement_mandat: 32,
        }, {
          id: 'IND-004',
          chantier_id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          ponderation_zone_reel: 20,
          valeur_cible_mandat: 13,
          taux_avancement_mandat: 33,
        }, {
          id: 'IND-005',
          chantier_id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          ponderation_zone_reel: 0,
          valeur_cible_mandat: 14,
          taux_avancement_mandat: 34,
        }, {
          id: 'IND-006',
          chantier_id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          ponderation_zone_reel: 0,
          valeur_cible_mandat: 15,
          taux_avancement_mandat: 35,
        }],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [{
          id: 'IND-001',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          taux_avancement: 10,
          valeur_cible: 20,
        }, {
          id: 'IND-002',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          taux_avancement: 11,
          valeur_cible: 21,
        }, {
          id: 'IND-003',
          code_insee: '01',
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          taux_avancement: 12,
          valeur_cible: 22,
        }, {
          id: 'IND-004',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          taux_avancement: 13,
          valeur_cible: 23,
        }, {
          id: 'IND-005',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          taux_avancement: 14,
          valeur_cible: 24,
        }, {
          id: 'IND-006',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          taux_avancement: 15,
          valeur_cible: 15,
        }],
      });

      // When
      const listeIndicateursResult = await prismaIndicateurRepository.récupérerIndicImpactParChantierId('CH-001');

      // Then

      expect(listeIndicateursResult).toMatchObject([{
        nom: 'Indicateur 001',
        type: 'IMPACT',
        objectifValeurCibleIntermediaire: 20,
        objectifTauxAvancementIntermediaire: 10,
        objectifValeurCible: 10,
        objectifTauxAvancement: 30,
      }, {
        nom: 'Indicateur 002',
        type: 'IMPACT',
        objectifValeurCibleIntermediaire: 21,
        objectifTauxAvancementIntermediaire: 11,
        objectifValeurCible: 11,
        objectifTauxAvancement: 31,
      }, {
        nom: 'Indicateur 004',
        type: 'Q_SERV',
        objectifValeurCibleIntermediaire: 23,
        objectifTauxAvancementIntermediaire: 13,
        objectifValeurCible: 13,
        objectifTauxAvancement: 33,
      },
      ]);
    });
  });
});
