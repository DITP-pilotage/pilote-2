import { indicateur, PrismaClient } from '@prisma/client';
import IndicateurSQLRepository from './IndicateurSQLRepository';

//   faciliter la lecture / écriture des tests (éventuellement une méthode de création des indicateurs ? fixture ?)

describe('IndicateurSQLRepository', () => {
  test("Récupère une liste vide quand il n'y a pas d'indicateurs", async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository = new IndicateurSQLRepository(prisma);

    // WHEN
    const result = await repository.getByChantierId('CH-001');

    // THEN
    expect(result).toStrictEqual([]);
  });

  test('Récupérer une liste d\'indicateur via un ID de chantier', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository = new IndicateurSQLRepository(prisma);

    const chantierId = 'CH-001';
    
    const indicateurs: indicateur[] = [
      {
        id: 'IND-001',
        code_insee: 'FR',
        maille: 'NAT',
        nom: 'Indicateur 1',
        chantier_id: chantierId,
        objectif_valeur_cible: null,
        objectif_taux_avancement: null,
        objectif_date_valeur_cible: null,
        type_id: null,
        type_nom: null,
        est_barometre: null,
        est_phare: null,
        valeur_initiale: null,
        date_valeur_initiale: null,
        valeur_actuelle: null,
        date_valeur_actuelle: null,
        territoire_nom: null,
      },
      {
        id: 'IND-002',
        code_insee: 'FR',
        maille: 'NAT',
        nom: 'Indicateur 2',
        chantier_id: chantierId,
        objectif_valeur_cible: null,
        objectif_taux_avancement: null,
        objectif_date_valeur_cible: null,
        type_id: null,
        type_nom: null,
        est_barometre: null,
        est_phare: null,
        valeur_initiale: null,
        date_valeur_initiale: null,
        valeur_actuelle: null,
        date_valeur_actuelle: null,
        territoire_nom: null,
      },
      {
        id: 'IND-003',
        code_insee: '75',
        maille: 'REG',
        nom: 'Indicateur 3',
        chantier_id: chantierId,
        objectif_valeur_cible: null,
        objectif_taux_avancement: null,
        objectif_date_valeur_cible: null,
        type_id: null,
        type_nom: null,
        est_barometre: null,
        est_phare: null,
        valeur_initiale: null,
        date_valeur_initiale: null,
        valeur_actuelle: null,
        date_valeur_actuelle: null,
        territoire_nom: null,
      },
    ];

    await prisma.indicateur.createMany({ data: indicateurs });

    // WHEN
    const result = await repository.getByChantierId(chantierId);

    // THEN
    expect(result.length).toEqual(2);
    expect(result[0].id).toEqual('IND-001');
    expect(result[1].id).toEqual('IND-002');
  });
});
