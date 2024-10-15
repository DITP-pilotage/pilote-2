import { APIRequestContext, APIResponse, expect, test } from '@playwright/test';
import {
  DonneeIndicateurContrat,
  DonneeTerritoireContrat,
} from '@/server/chantiers/app/contrats/DonneeIndicateurContrat';
import { configuration } from '@/config';

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

  await test.step('Appel du endpoint /api/open-api/chantier/CH-039/indicateur/IND-718/donnees', async () => {
    result = await apiContext.get('/api/open-api/chantier/CH-039/indicateur/IND-718/donnees');
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

  await test.step('Appel du endpoint /api/open-api/chantier/CH-001/indicateur/IND-900/donnees', async () => {
    result = await apiContext.get('/api/open-api/chantier/CH-001/indicateur/IND-900/donnees');
  });

  await test.step('Vérification status égal 200 OK', async () => {
    expect(result.status()).toEqual(200);
  });

  let donneeIndicateur: DonneeIndicateurContrat;

  await test.step('Récupération de la donnee indicateur dans le contenu de la réponse', async () => {
    donneeIndicateur = await result.json() as DonneeIndicateurContrat;
  });

  await test.step('Vérification donnees appartiennent bien au CH-039 et IND-718', async () => {
    expect(donneeIndicateur.chantier_id).toEqual('CH-001');
    expect(donneeIndicateur.indic_id).toEqual('IND-900');
  });

  await test.step('Vérification donnees territoires possèdes bien 101 données departementales, 18 données régionales et 1 donnée nationale', async () => {
    expect(donneeIndicateur.donnees_territoires.filter(donneeTerritoire => donneeTerritoire.maille === 'DEPT')).toHaveLength(101);
    expect(donneeIndicateur.donnees_territoires.filter(donneeTerritoire => donneeTerritoire.maille === 'REG')).toHaveLength(18);
    expect(donneeIndicateur.donnees_territoires.filter(donneeTerritoire => donneeTerritoire.maille === 'NAT')).toHaveLength(1);
  });

  let donneeTerritoire: DonneeTerritoireContrat;
  await test.step('Récupération de la première donnée territoire', async () => {
    donneeTerritoire = donneeIndicateur.donnees_territoires[0];
  });

  await test.step("Vérification qu'une donnée territoire possède une 'maille', un 'code_insee' et un 'territoire_code'", async () => {
    expect(donneeTerritoire.maille).toBeDefined();
    expect(donneeTerritoire.code_insee).toBeDefined();
    expect(donneeTerritoire.territoire_code).toBeDefined();
  });
  await test.step("Vérification qu'une donnée territoire possède une 'date_valeur_actuelle' et une 'valeur_actuelle'", async () => {
    expect(donneeTerritoire.date_valeur_actuelle).toBeDefined();
    expect(donneeTerritoire.valeur_actuelle).toBeDefined();
  });
  await test.step("Vérification qu'une donnée territoire possède une 'date_valeur_cible' et une 'valeur_cible'", async () => {
    expect(donneeTerritoire.date_valeur_cible).toBeDefined();
    expect(donneeTerritoire.valeur_cible).toBeDefined();
  });
  await test.step("Vérification qu'une donnée territoire possède une 'date_valeur_cible_annuelle' et une 'valeur_cible_annuelle'", async () => {
    expect(donneeTerritoire.date_valeur_cible_annuelle).toBeDefined();
    expect(donneeTerritoire.valeur_cible_annuelle).toBeDefined();
  });
  await test.step("Vérification qu'une donnée territoire possède une 'date_valeur_initiale' et une 'valeur_initiale'", async () => {
    expect(donneeTerritoire.date_valeur_initiale).toBeDefined();
    expect(donneeTerritoire.valeur_initiale).toBeDefined();
  });
  await test.step("Vérification qu'une donnée territoire possède un 'taux_avancement' et un 'taux_avancement_annuel'", async () => {
    expect(donneeTerritoire.taux_avancement).toBeDefined();
    expect(donneeTerritoire.taux_avancement_annuel).toBeDefined();
  });
  await test.step("Vérification qu'une donnée territoire possède une 'zone_id'", async () => {
    expect(donneeTerritoire.zone_id).toBeDefined();
  });
});
