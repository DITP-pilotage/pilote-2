import { expect, test } from "@playwright/test";
import { DonneeChantierContrat } from "@/server/chantiers/app/contrats/DonneeChantierContrat";
import { ApiTestContext } from "./api-client/api-test-context";

test("Quand on a accès au chantier, doit remonter une réponse 200 OK avec les données de l'indicateur", async ({
  playwright,
}) => {
  const apiContext = await ApiTestContext.create(
    playwright,
    "EQUIPE_DIR_PROJET",
  );
  const client = apiContext.getClient();
  const chantierId = apiContext.chantierId!;

  const result = await client.getChantierDonnees(chantierId);

  expect(result.status()).toEqual(200);

  const donneeChantier = (await result.json()) as DonneeChantierContrat;

  expect(donneeChantier.chantier_id).toEqual(chantierId);
  expect(donneeChantier.nom).toBeDefined();

  const donneesDept = donneeChantier.donnees_territoires.filter(
    (donneeTerritoire) => donneeTerritoire.maille === "DEPT",
  );
  const donneesReg = donneeChantier.donnees_territoires.filter(
    (donneeTerritoire) => donneeTerritoire.maille === "REG",
  );
  const donneesNat = donneeChantier.donnees_territoires.filter(
    (donneeTerritoire) => donneeTerritoire.maille === "NAT",
  );

  expect(donneesDept.length).toBeGreaterThan(0);
  expect(donneesReg.length).toBeGreaterThan(0);
  expect(donneesNat).toHaveLength(1);

  const premierTerritoire = donneeChantier.donnees_territoires[0];

  expect(premierTerritoire.taux_avancement_dept).toBeDefined();
  expect(premierTerritoire.taux_avancement_region).toBeDefined();
  expect(premierTerritoire.taux_avancement_nat).toBeDefined();
  expect(premierTerritoire.taux_avancement_annuel).toBeDefined();

  expect(premierTerritoire.publication.synthese_des_resultats).toBeDefined();
  expect(premierTerritoire.publication.notre_ambition).toBeDefined();
  expect(premierTerritoire.publication.ce_qui_a_deja_ete_fait).toBeDefined();
  expect(premierTerritoire.publication.ce_qui_reste_a_faire).toBeDefined();
  expect(
    premierTerritoire.publication.suivi_decisions_strategiques,
  ).toBeDefined();
  expect(
    premierTerritoire.publication.autres_resultats_non_coreeles_aux_indic,
  ).toBeDefined();
  expect(premierTerritoire.publication.risques_et_freins_a_lever).toBeDefined();
  expect(premierTerritoire.publication.solutions).toBeDefined();
  expect(premierTerritoire.publication.exemples_reussite).toBeDefined();
  expect(
    premierTerritoire.publication.commentaires_sur_les_donnees,
  ).toBeDefined();
  expect(premierTerritoire.publication.autres_resultats).toBeDefined();

  await apiContext.dispose();
});
