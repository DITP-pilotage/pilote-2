import { APIRequestContext, APIResponse, expect, test } from '@playwright/test';
import { DonneeChantierContrat } from '@/server/chantiers/app/contrats/DonneeChantierContrat';
import { authentificationApiDirProjetFn, suppressionAuthentificationApiFn } from '../utils';
import { configuration } from '@/config';

let apiContext: APIRequestContext;
let result: APIResponse;

test("Quand on a accès au chantier, doit remonter une réponse 200 OK avec les données de l'indicateur", async ({ playwright, page }) => {
  const { apiDirProjetToken, apiDirProjetUsername, apiDirProjetChantierAssocie } = await authentificationApiDirProjetFn({ page });
  
  await test.step('Création du context - Authorization Pilote - equipe.dir.projet@example.com - EQUIPE_DIR_PROJET', async () => {
    apiContext = await playwright.request.newContext({
      baseURL: configuration.baseUrl,
      extraHTTPHeaders: {
        'Authorization': `Bearer ${apiDirProjetToken}`,
      },
    });
  });

  await test.step(`Appel du endpoint /api/open-api/chantier/${apiDirProjetChantierAssocie}/donnees`, async () => {
    result = await apiContext.get(`/api/open-api/chantier/${apiDirProjetChantierAssocie}/donnees`);
  });

  await test.step('Vérification status égal 200 OK', async () => {
    expect(result.status()).toEqual(200);
  });

  let donneeChantier: DonneeChantierContrat;

  await test.step('Récupération de la donnee chantier dans le contenu de la réponse', async () => {
    donneeChantier = await result.json() as DonneeChantierContrat;
  });

  await test.step(`Vérification données appartiennent bien au ${apiDirProjetChantierAssocie}`, async () => {
    expect(donneeChantier.chantier_id).toEqual(`${apiDirProjetChantierAssocie}`);
    expect(donneeChantier.nom).toBeDefined();
  });

  await test.step('Vérification donnees territoires possèdes bien 25 données departementales, 8 données régionales et 1 donnée nationale', async () => {
    expect(donneeChantier.donnees_territoires.filter(donneeTerritoire => donneeTerritoire.maille === 'DEPT').length).toBeGreaterThan(0);
    expect(donneeChantier.donnees_territoires.filter(donneeTerritoire => donneeTerritoire.maille === 'REG').length).toBeGreaterThan(0);
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

  await suppressionAuthentificationApiFn({ page, apiUsername: apiDirProjetUsername });
});
