import { APIRequestContext, APIResponse, expect, test } from '@playwright/test';
import {
  DonneeIndicateurContrat,
  DonneeTerritoireContrat,
} from '@/server/chantiers/app/contrats/DonneeIndicateurContrat';
import { configuration } from '@/config';
import { DonneeChantierContrat } from '@/server/chantiers/app/contrats/DonneeChantierContrat';

let apiContext: APIRequestContext;
let result: APIResponse;

const localTokenAPIEquipeDirProjet =  configuration.tokenAPI.localTokenAPIE2EEquipeDirProjet;

test('quand on a pas accès au chantier, doit remonter une erreur 403 Forbidden', async ({ playwright }) => {
  await test.step('Création du context - Authorization Pilote - equipe.dir.projet@example.com - EQUIPE_DIR_PROJET', async () => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Authorization': `Bearer ${localTokenAPIEquipeDirProjet}`,
      },
    });
  });

  await test.step('Appel du endpoint /api/open-api/chantier/CH-039/donnees', async () => {
    result = await apiContext.get('/api/open-api/chantier/CH-039/donnees');
  });

  await test.step('Vérification status égal 403 Forbidden', async () => {
    expect(result.status()).toEqual(403);
  });

  await test.step('Vérification message égal "Vous n\'êtes pas autorisé à acceder au chantier CH-039"', async () => {
    expect(await result.json()).toEqual({
      message: "Vous n'êtes pas autorisé à acceder au chantier CH-039",
    });
  });
});

test("Quand on a accès au chantier, doit remonter une réponse 200 OK avec les données de l'indicateur", async ({ playwright }) => {
  await test.step('Création du context - Authorization Pilote - equipe.dir.projet@example.com - EQUIPE_DIR_PROJET', async () => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Authorization': `Bearer ${localTokenAPIEquipeDirProjet}`,
      },
    });
  });

  await test.step('Appel du endpoint /api/open-api/chantier/CH-058/donnees', async () => {
    result = await apiContext.get('/api/open-api/chantier/CH-058/donnees');
  });

  await test.step('Vérification status égal 200 OK', async () => {
    expect(result.status()).toEqual(200);
  });

  let donneeChantier: DonneeChantierContrat;

  await test.step('Récupération de la donnee chantier dans le contenu de la réponse', async () => {
    donneeChantier = await result.json() as DonneeChantierContrat;
  });

  await test.step('Vérification données appartiennent bien au CH-058', async () => {
    expect(donneeChantier.chantier_id).toEqual('CH-058');
    expect(donneeChantier.nom).toEqual('Installer 50 parcs éoliens en mer d\'ici 2050');
  });

  await test.step('Vérification donnees territoires possèdes bien 25 données departementales, 8 données régionales et 1 donnée nationale', async () => {
    expect(donneeChantier.donnees_territoires.filter(donneeTerritoire => donneeTerritoire.maille === 'DEPT')).toHaveLength(25);
    expect(donneeChantier.donnees_territoires.filter(donneeTerritoire => donneeTerritoire.maille === 'REG')).toHaveLength(8);
    expect(donneeChantier.donnees_territoires.filter(donneeTerritoire => donneeTerritoire.maille === 'NAT')).toHaveLength(1);
  });

  await test.step('Vérification données territoire possède les taux_avancement national, régional, départemental et annuel', async () => {
    expect(donneeChantier.donnees_territoires[0].taux_avancement_dept).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].taux_avancement_region).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].taux_avancement_nat).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].taux_avancement_annuel).toBeDefined();
  });

  await test.step('Vérification données territoire possède les éléments des publications', async () => {
    expect(donneeChantier.donnees_territoires[0].publication.synthese_des_resultats).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].publication.notre_ambition).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].publication.ce_qui_a_deja_ete_fait).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].publication.ce_qui_reste_a_faire).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].publication.suivi_decisions_strategiques).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].publication.autres_resultats_non_coreeles_aux_indic).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].publication.risques_et_freins_a_lever).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].publication.solutions).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].publication.exemples_reussite).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].publication.commentaires_sur_les_donnees).toBeDefined();
    expect(donneeChantier.donnees_territoires[0].publication.autres_resultats).toBeDefined();
  });
});
