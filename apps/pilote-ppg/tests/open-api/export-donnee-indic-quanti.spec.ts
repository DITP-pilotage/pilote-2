import { expect } from "@playwright/test";
import { DonneeIndicateurContrat } from "@/server/chantiers/app/contrats/DonneeIndicateurContrat";
import { test } from "../fixtures";

test("Quand on a accès au chantier, doit remonter une réponse 200 OK avec les données de l'indicateur", async ({
  openApi,
}) => {
  const client = (await openApi("EQUIPE_DIR_PROJET")).getClient();

  const result = await client.getIndicateurDonnees("CH-129", "IND-021");

  expect(result.status()).toEqual(200);
  const donneeIndicateur = (await result.json()) as DonneeIndicateurContrat;
  expect(donneeIndicateur.chantier_id).toEqual("CH-129");
  expect(donneeIndicateur.indic_id).toEqual("IND-021");

  const mailles = donneeIndicateur.donnees_territoires.map(
    (donneeTerritoire) => donneeTerritoire.maille,
  );
  expect(mailles.filter((maille) => maille === "NAT")).toHaveLength(1);
  expect(mailles.filter((maille) => maille === "REG")).toHaveLength(18);
  expect(mailles.filter((maille) => maille === "DEPT")).toHaveLength(101);

  expect(
    donneeIndicateur.donnees_territoires.find(
      (donneeTerritoire) => donneeTerritoire.territoire_code === "NAT-FR",
    ),
  ).toEqual({
    maille: "NAT",
    code_insee: "FR",
    territoire_code: "NAT-FR",
    zone_id: "FRANCE",
    valeur_initiale: null,
    date_valeur_initiale: null,
    valeur_actuelle: 0,
    date_valeur_actuelle: "2025-06-01T00:00:00.000Z",
    valeur_avancement: 0,
    date_valeur_avancement: "2025-06-01T00:00:00.000Z",
    valeur_cible: null,
    date_valeur_cible: null,
    taux_avancement: null,
    valeur_cible_annuelle: null,
    date_valeur_cible_annuelle: null,
    taux_avancement_annuel: null,
  });
});
