import { $Enums } from "@prisma/client";
import { getContainer } from "@/server/dependances";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

const EMAIL_UTILISATEUR_IMPORT = "import.csv@modernisation.gouv.fr";

function créerUseCase() {
  return getContainer("importDonneesChantierCSV").resolve(
    "importerDonneesChantierCSVUseCase",
  );
}

async function créerChantierRattachéÀNatFr() {
  const chantier = await fixtures.chantierIdentite();
  await fixtures.chantierTerritoire({
    id: chantier.id,
    territoire_code: "NAT-FR",
    zone_id: "FRANCE",
    code_insee: "FR",
    maille: $Enums.Maille.NAT,
  });
  return chantier;
}

describe("ImporterDonneesChantierCSVUseCase", () => {
  it(
    "répartit les lignes d'un CSV vers les 4 domaines cibles",
    createIntegrationTest(async (tx) => {
      // Given
      await fixtures.utilisateur({ email: EMAIL_UTILISATEUR_IMPORT });
      const chantier = await créerChantierRattachéÀNatFr();

      const lignesBrutes = [
        {
          chantier_id: chantier.id,
          type: "risques_et_freins_a_lever",
          contenu: "Un frein identifié",
          date: "2026-01-15",
          auteur_email: "",
          maille: "",
          code_insee: "",
          meteo: "",
        },
        {
          chantier_id: chantier.id,
          type: "synthese_des_resultats",
          contenu: "Trajectoire conforme",
          date: "2026-01-15",
          auteur_email: "",
          maille: "",
          code_insee: "",
          meteo: "SOLEIL",
        },
        {
          chantier_id: chantier.id,
          type: "suivi_des_decisions",
          contenu: "Décision actée",
          date: "2026-01-15",
          auteur_email: "",
          maille: "",
          code_insee: "",
          meteo: "",
        },
        {
          chantier_id: chantier.id,
          type: "notre_ambition",
          contenu: "Réduire le délai",
          date: "2026-01-15",
          auteur_email: "",
          maille: "",
          code_insee: "",
          meteo: "",
        },
      ];

      // When
      const résultat = await créerUseCase().execute(lignesBrutes);

      // Then
      expect(résultat).toEqual({
        succès: true,
        comptesParDomaine: {
          commentaire: 1,
          synthese_des_resultats: 1,
          decision_strategique: 1,
          objectif: 1,
        },
      });

      const commentaires = await tx.commentaire.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(commentaires.map((commentaire) => commentaire.type)).toEqual([
        "freins_a_lever",
      ]);

      const syntheses = await tx.synthese_des_resultats.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(syntheses.map((synthese) => synthese.meteo)).toEqual(["SOLEIL"]);

      const decisions = await tx.decision_strategique.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(decisions.map((decision) => decision.type)).toEqual([
        "suivi_des_decisions",
      ]);

      const objectifs = await tx.objectif.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(objectifs.map((objectif) => objectif.type)).toEqual([
        "notre_ambition",
      ]);
    }),
  );

  it(
    "attribue le commentaire à l'auteur correspondant à auteur_email",
    createIntegrationTest(async (tx) => {
      // Given
      await fixtures.utilisateur({ email: EMAIL_UTILISATEUR_IMPORT });
      const chantier = await créerChantierRattachéÀNatFr();
      const auteur = await fixtures.utilisateur();

      // When
      await créerUseCase().execute([
        {
          chantier_id: chantier.id,
          type: "commentaires_sur_les_donnees",
          contenu: "Commentaire attribué",
          date: "2026-01-15",
          auteur_email: auteur.email,
          maille: "",
          code_insee: "",
          meteo: "",
        },
      ]);

      // Then
      const commentaires = await tx.commentaire.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(
        commentaires.map((commentaire) => commentaire.auteur_creation_id),
      ).toEqual([auteur.id]);
    }),
  );

  it(
    "attribue à l'utilisateur système quand auteur_email est vide ou inconnu",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateurImport = await fixtures.utilisateur({
        email: EMAIL_UTILISATEUR_IMPORT,
      });
      const chantier = await créerChantierRattachéÀNatFr();

      // When
      await créerUseCase().execute([
        {
          chantier_id: chantier.id,
          type: "commentaires_sur_les_donnees",
          contenu: "Commentaire sans auteur connu",
          date: "2026-01-15",
          auteur_email: "inconnu@test.com",
          maille: "",
          code_insee: "",
          meteo: "",
        },
      ]);

      // Then
      const commentaires = await tx.commentaire.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(
        commentaires.map((commentaire) => commentaire.auteur_creation_id),
      ).toEqual([utilisateurImport.id]);
    }),
  );

  it(
    "n'importe rien si une ligne est invalide (tout ou rien)",
    createIntegrationTest(async (tx) => {
      // Given
      await fixtures.utilisateur({ email: EMAIL_UTILISATEUR_IMPORT });
      const chantier = await créerChantierRattachéÀNatFr();

      // When
      const résultat = await créerUseCase().execute([
        {
          chantier_id: chantier.id,
          type: "commentaires_sur_les_donnees",
          contenu: "Commentaire valide",
          date: "2026-01-15",
          auteur_email: "",
          maille: "",
          code_insee: "",
          meteo: "",
        },
        {
          chantier_id: chantier.id,
          type: "type_inexistant",
          contenu: "Commentaire invalide",
          date: "2026-01-15",
          auteur_email: "",
          maille: "",
          code_insee: "",
          meteo: "",
        },
      ]);

      // Then
      expect(résultat.succès).toEqual(false);
      const commentaires = await tx.commentaire.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(commentaires).toEqual([]);
    }),
  );
});
