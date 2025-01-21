import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { PrismaIndicateurRepository } from '@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository';

describe('PrismaIndicateurRepository', () => {
  let prismaIndicateurRepository: PrismaIndicateurRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new PrismaIndicateurRepository(prisma);
  });

  it("doit récupérer les données associés à l'indicateur", async () => {
    // Given
    const indicId = 'IND-001';
    await prisma.chantier_identite.create({
      data: {
        id: 'CH-168',
        nom: 'Nom chantier OK',
        directeurs_administration_centrale: ['DAC 1', 'DAC 2'],
        directeurs_projet: ['DP 1', 'DP 2'],
      },
    });

    await prisma.chantier_territoire.create({
      data: {
        id: 'CH-168',
        code_insee: 'FR',
        maille: 'NAT',
        zone_id: 'FRANCE',
        territoire_code: 'NAT-FR',
      },
    });

    await prisma.indicateur_identite.create({
      data: {
        id: 'IND-001',
        nom: 'Indicateur OK',
        chantier_id: 'CH-168',
        type_id: 'IMPACT',
      },
    });

    await prisma.indicateur_territoire.createMany({
      data: [{
        id: 'IND-001',
        code_insee: 'FR',
        maille: 'NAT',
        zone_id: 'FRANCE',
        territoire_code: 'NAT-FR',
        ponderation_zone_reel: 20,
      }, {
        id: 'IND-001',
        code_insee: '01',
        maille: 'REG',
        zone_id: 'D51',
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
        jalon: '2024',
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
        maille: 'REG',
        zone_id: 'D51',
        territoire_code: 'REG-01',
        valeur_cible: 22,
        date_valeur_cible: new Date('2025-12-06'),
        taux_avancement: 13,
        jalon: 2025,
      }],
    });

    // When
    const listeDonneesIndicateurs = await prismaIndicateurRepository.listerParIndicId({ indicId });
    // Then
    expect(listeDonneesIndicateurs).toHaveLength(2);
    expect(listeDonneesIndicateurs[0].indicId).toEqual('IND-001');
    expect(listeDonneesIndicateurs[0].territoireCode).toEqual('NAT-FR');
    expect(listeDonneesIndicateurs[0].valeurCibleAnnuelle).toEqual(22);
    expect(listeDonneesIndicateurs[0].dateValeurCibleAnnuelle?.toISOString()).toStartWith('2025-12-06');
    expect(listeDonneesIndicateurs[0].tauxAvancementAnnuel).toEqual(13);
    expect(listeDonneesIndicateurs[1].indicId).toEqual('IND-001');
    expect(listeDonneesIndicateurs[1].territoireCode).toEqual('REG-01');
  });

  it("doit supprimer les données associés à la proposition de valeur actuelle de l'indicateur", async () => {
    // Given
    const indicId = 'IND-001';
    await prisma.chantier_identite.create({
      data: {
        id: 'CH-168',
        nom: 'Nom chantier OK',
        directeurs_administration_centrale: ['DAC 1', 'DAC 2'],
        directeurs_projet: ['DP 1', 'DP 2'],
      },
    });

    await prisma.indicateur_identite.create({
      data: {
        id: 'IND-001',
        nom: 'Indicateur OK',
        chantier_id: 'CH-168',
        type_id: 'IMPACT',
      },
    });

    await prisma.indicateur_territoire.create({
      data: {
        id: 'IND-001',
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

    expect(indicateur?.indicateur_territoire[0].motif_proposition).toEqual(null);
    expect(indicateur?.indicateur_territoire[0].date_proposition).toEqual(null);
    expect(indicateur?.indicateur_territoire[0].auteur_proposition).toEqual('Jane Doe');
    expect(indicateur?.indicateur_territoire[0].valeur_actuelle_proposition).toEqual(null);
    expect(indicateur?.indicateur_territoire[0].source_donnee_methode_calcul_proposition).toEqual(null);
    expect(indicateur?.indicateur_territoire[0].taux_avancement_mandat_proposition).toEqual(null);
    expect(indicateur?.indicateur_territoire[0].indicateur_territoire_jalon[0].taux_avancement_proposition).toEqual(null);
  });
});
