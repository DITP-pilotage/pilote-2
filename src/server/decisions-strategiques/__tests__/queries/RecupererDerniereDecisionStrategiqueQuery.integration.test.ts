import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererDerniereDecisionStrategiqueQuery } from "@/server/decisions-strategiques/queries/RecupererDerniereDecisionStrategiqueQuery";

describe("RecupererDerniereDecisionStrategiqueQuery", () => {
  let query: RecupererDerniereDecisionStrategiqueQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererDerniereDecisionStrategiqueQuery({
      prisma: prismaPilote,
    });
  });

  it(
    "retourne null quand aucune décision publiée n'existe",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "retourne null quand le seul enregistrement est un brouillon",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "retourne la décision publiée avec le nom de l'auteur de modification",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur({
        nom: "Dupont",
        prenom: "Jean",
      });
      const chantier = await fixtures.chantierIdentite();
      const decision = await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-01-01"),
        date_modification: new Date("2025-06-01"),
        contenu: "Ma décision publiée",
        statut: $Enums.statut_publication.PUBLIE,
      });

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result).toEqual({
        id: decision.id,
        chantierId: chantier.id,
        type: "suiviDesDécisionsStratégiques",
        contenu: "Ma décision publiée",
        statut: $Enums.statut_publication.PUBLIE,
        auteurCreationId: auteur.id,
        dateCreation: new Date("2025-01-01").toISOString(),
        auteurModificationId: auteur.id,
        dateModification: new Date("2025-06-01").toISOString(),
        auteurModificationNom: "Jean Dupont",
      });
    }),
  );

  it(
    "retourne la décision publiée la plus récente",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-01-01"),
        contenu: "Ancienne décision",
      });
      const recente = await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-06-01"),
        contenu: "Décision récente",
      });

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result).toEqual(
        expect.objectContaining({
          id: recente.id,
          contenu: "Décision récente",
        }),
      );
    }),
  );
});
