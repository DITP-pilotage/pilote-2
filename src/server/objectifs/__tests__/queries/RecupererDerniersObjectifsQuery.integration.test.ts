import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererDerniersObjectifsQuery } from "@/server/objectifs/queries/RecupererDerniersObjectifsQuery";

const TYPE = "notreAmbition" as const;
const TYPE_DB = "notre_ambition" as const;

describe("RecupererDerniersObjectifsQuery", () => {
  let query: RecupererDerniersObjectifsQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererDerniersObjectifsQuery({ prisma: prismaPilote });
  });

  it(
    "retourne null pour chaque type quand aucun objectif publié n'existe",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result[TYPE]).toBeNull();
    }),
  );

  it(
    "retourne null pour un type quand le seul objectif est un brouillon",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      // Seul un brouillon existe
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Brouillon",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result[TYPE]).toBeNull();
    }),
  );

  it(
    "retourne le dernier objectif publié par type avec le nom de l'auteur",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur({
        nom: "Dupont",
        prenom: "Jean",
      });
      const chantier = await fixtures.chantierIdentite();
      const objectif = await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-01-01"),
        date_modification: new Date("2025-06-01"),
        contenu: "Mon objectif publié",
        statut: $Enums.statut_publication.PUBLIE,
      });

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result[TYPE]).toEqual({
        id: objectif.id,
        chantierId: chantier.id,
        type: TYPE,
        contenu: "Mon objectif publié",
        statut: $Enums.statut_publication.PUBLIE,
        auteurCreationId: auteur.id,
        dateCreation: new Date("2025-01-01").toISOString(),
        auteurModificationId: auteur.id,
        dateModification: new Date("2025-06-01").toISOString(),
        auteurCreationNom: "Jean Dupont",
        auteurModificationNom: "Jean Dupont",
      });
    }),
  );

  it(
    "retourne l'objectif le plus récent par type",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-01-01"),
        contenu: "Ancien objectif",
      });
      const recent = await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-06-01"),
        contenu: "Objectif récent",
      });

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result[TYPE]).toEqual(
        expect.objectContaining({ id: recent.id, contenu: "Objectif récent" }),
      );
    }),
  );

  it(
    "retourne les objectifs pour chaque type indépendamment",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: "notre_ambition",
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Notre ambition",
      });
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: "deja_fait",
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Déjà fait",
      });

      // When
      const result = await query.run(chantier.id);

      // Then
      expect(result["notreAmbition"]).toEqual(
        expect.objectContaining({ contenu: "Notre ambition" }),
      );
      expect(result["dejaFait"]).toEqual(
        expect.objectContaining({ contenu: "Déjà fait" }),
      );
      expect(result["aFaire"]).toBeNull();
    }),
  );
});
