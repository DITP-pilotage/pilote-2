import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererHistoriqueDecisionStrategiqueQuery } from "@/server/decisions-strategiques/queries/RecupererHistoriqueDecisionStrategiqueQuery";

describe("RecupererHistoriqueDecisionStrategiqueQuery", () => {
  let query: RecupererHistoriqueDecisionStrategiqueQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererHistoriqueDecisionStrategiqueQuery({
      prisma: prismaPilote,
    });
  });

  it(
    "retourne un tableau vide quand aucune décision n'existe",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result).toEqual([]);
    }),
  );

  it(
    "retourne les décisions publiées avec le nom de l'auteur de modification",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur({
        nom: "Dupont",
        prenom: "Jean",
      });
      const chantier = await fixtures.chantierIdentite();
      await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-01-01"),
        date_modification: new Date("2025-01-01"),
        contenu: "Première décision",
      });
      await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-06-01"),
        date_modification: new Date("2025-06-01"),
        contenu: "Deuxième décision",
      });

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result).toEqual([
        expect.objectContaining({
          contenu: "Deuxième décision",
          auteurCreationNom: "Jean Dupont",
          auteurModificationNom: "Jean Dupont",
        }),
        expect.objectContaining({
          contenu: "Première décision",
          auteurCreationNom: "Jean Dupont",
          auteurModificationNom: "Jean Dupont",
        }),
      ]);
    }),
  );

  it(
    "exclut les brouillons",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        auteur_modification_id: auteur.id,
        contenu: "Décision publiée",
        statut: $Enums.statut_publication.PUBLIE,
      });
      // Brouillon ne doit pas apparaître dans l'historique
      await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        auteur_modification_id: auteur.id,
        contenu: "Brouillon",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result).toEqual([
        expect.objectContaining({ contenu: "Décision publiée" }),
      ]);
    }),
  );

  it(
    "retourne les décisions dans l'ordre décroissant par date_modification",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-01-01"),
        contenu: "Décision ancienne",
      });
      await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-06-01"),
        contenu: "Décision récente",
      });

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result).toEqual([
        expect.objectContaining({ contenu: "Décision récente" }),
        expect.objectContaining({ contenu: "Décision ancienne" }),
      ]);
    }),
  );
});
