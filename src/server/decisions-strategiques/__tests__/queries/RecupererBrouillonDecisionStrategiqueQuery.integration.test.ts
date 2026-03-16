import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererBrouillonDecisionStrategiqueQuery } from "@/server/decisions-strategiques/queries/RecupererBrouillonDecisionStrategiqueQuery";

describe("RecupererBrouillonDecisionStrategiqueQuery", () => {
  let query: RecupererBrouillonDecisionStrategiqueQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererBrouillonDecisionStrategiqueQuery({
      prisma: prismaPilote,
    });
  });

  it(
    "retourne null quand aucun brouillon n'existe pour cet utilisateur",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();

      // When
      const result = await query.run(chantier.id, utilisateur.id);

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "retourne null quand le seul enregistrement est une publication",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        auteur_modification_id: auteur.id,
        statut: $Enums.statut_publication.PUBLIE,
      });

      // When
      const result = await query.run(chantier.id, auteur.id);

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "retourne null quand le brouillon appartient à un autre utilisateur",
    createIntegrationTest(async () => {
      // Given
      const auteurBrouillon = await fixtures.utilisateur();
      const autreUtilisateur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      // Brouillon appartenant à auteurBrouillon
      await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        auteur_modification_id: auteurBrouillon.id,
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, autreUtilisateur.id);

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "retourne le brouillon de l'utilisateur avec les champs corrects",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      const brouillon = await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-01-01"),
        date_modification: new Date("2025-06-01"),
        contenu: "Mon brouillon",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, auteur.id);

      // Then
      expect(result).toEqual({
        id: brouillon.id,
        chantierId: chantier.id,
        type: "suiviDesDecisionsStrategiques",
        contenu: "Mon brouillon",
        statut: $Enums.statut_publication.BROUILLON,
        auteurCreationId: auteur.id,
        dateCreation: new Date("2025-01-01").toISOString(),
        auteurModificationId: auteur.id,
        dateModification: new Date("2025-06-01").toISOString(),
      });
    }),
  );
});
