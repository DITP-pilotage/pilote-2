import { expect, test } from "@playwright/test";
import {
  DonneeIndicateurContrat,
  DonneeTerritoireContrat,
} from "@/server/chantiers/app/contrats/DonneeIndicateurContrat";
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
  const indicateurId = apiContext.indicateurId!;

  const result = await client.getIndicateurDonnees(chantierId, indicateurId);

  expect(result.status()).toEqual(200);

  const donneeIndicateur = (await result.json()) as DonneeIndicateurContrat;

  expect(donneeIndicateur.chantier_id).toEqual(chantierId);
  expect(donneeIndicateur.indic_id).toEqual(indicateurId);

  const donneesDept = donneeIndicateur.donnees_territoires.filter(
    (donneeTerritoire) => donneeTerritoire.maille === "DEPT",
  );
  const donneesReg = donneeIndicateur.donnees_territoires.filter(
    (donneeTerritoire) => donneeTerritoire.maille === "REG",
  );
  const donneesNat = donneeIndicateur.donnees_territoires.filter(
    (donneeTerritoire) => donneeTerritoire.maille === "NAT",
  );

  expect(donneesDept).toHaveLength(101);
  expect(donneesReg).toHaveLength(18);
  expect(donneesNat).toHaveLength(1);

  const donneeTerritoire: DonneeTerritoireContrat =
    donneeIndicateur.donnees_territoires[0];

  expect(donneeTerritoire.maille).toBeDefined();
  expect(donneeTerritoire.code_insee).toBeDefined();
  expect(donneeTerritoire.territoire_code).toBeDefined();

  expect(donneeTerritoire.date_valeur_cible).toBeDefined();
  expect(donneeTerritoire.valeur_cible).toBeDefined();

  expect(donneeTerritoire.date_valeur_initiale).toBeDefined();
  expect(donneeTerritoire.valeur_initiale).toBeDefined();

  expect(donneeTerritoire.taux_avancement).toBeDefined();

  expect(donneeTerritoire.zone_id).toBeDefined();

  await apiContext.dispose();
});
