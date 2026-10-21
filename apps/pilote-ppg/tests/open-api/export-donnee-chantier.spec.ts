import { expect } from "@playwright/test";
import { DonneeChantierContrat } from "@/server/chantiers/app/contrats/DonneeChantierContrat";
import { test } from "../fixtures";

const PUBLICATION_VIDE = {
  synthese_des_resultats: null,
  notre_ambition: null,
  ce_qui_a_deja_ete_fait: null,
  ce_qui_reste_a_faire: null,
  suivi_decisions_strategiques: null,
  autres_resultats_non_coreeles_aux_indic: null,
  risques_et_freins_a_lever: null,
  solutions: null,
  exemples_reussite: null,
  commentaires_sur_les_donnees: null,
  autres_resultats: null,
};

test("Quand on a accès au chantier, doit remonter une réponse 200 OK avec les données du chantier", async ({
  openApi,
}) => {
  const client = (await openApi("EQUIPE_DIR_PROJET")).getClient();

  const result = await client.getChantierDonnees("CH-129");

  expect(result.status()).toEqual(200);
  const donneeChantier = (await result.json()) as DonneeChantierContrat;
  expect(donneeChantier).toMatchObject({
    chantier_id: "CH-129",
    nom: "Moderniser la gestion des ressources",
    ministere: "MI",
    statut: "PUBLIE",
    est_barometre: false,
    est_territorialise: true,
  });

  const mailles = donneeChantier.donnees_territoires.map(
    (donneeTerritoire) => donneeTerritoire.maille,
  );
  expect(mailles.filter((maille) => maille === "NAT")).toHaveLength(1);
  expect(mailles.filter((maille) => maille === "REG")).toHaveLength(18);
  expect(mailles.filter((maille) => maille === "DEPT")).toHaveLength(101);

  expect(
    donneeChantier.donnees_territoires.find(
      (donneeTerritoire) => donneeTerritoire.territoire_code === "DEPT-13",
    ),
  ).toEqual({
    maille: "DEPT",
    territoire_code: "DEPT-13",
    meteo: null,
    responsables_locaux: "Non applicable",
    responsable_locaux_mails: "Non applicable",
    taux_avancement_dept: "Non applicable",
    taux_avancement_region: "Non applicable",
    taux_avancement_nat: "Non applicable",
    taux_avancement_annuel: "Non applicable",
    publication: PUBLICATION_VIDE,
  });
});
