import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererHistoriqueObjectifQuery } from "@/server/objectifs/queries/RecupererHistoriqueObjectifQuery";

const TYPE = "notreAmbition" as const;
const TYPE_DB = "notre_ambition" as const;

describe("RecupererHistoriqueObjectifQuery", () => {
  let query: RecupererHistoriqueObjectifQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererHistoriqueObjectifQuery({ prisma: prismaPilote });
  });

  it(
    "retourne un tableau vide quand aucun objectif n'existe",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();

      // When
      const result = await query.run(chantier.id, TYPE);

      // Then
      expect(result).toEqual([]);
    }),
  );

  it(
    "retourne les objectifs publiés avec le nom de l'auteur",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur({
        nom: "Dupont",
        prenom: "Jean",
      });
      const chantier = await fixtures.chantierIdentite();
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-01-01"),
        date_modification: new Date("2025-01-01"),
        contenu: "Premier objectif",
      });
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-06-01"),
        date_modification: new Date("2025-06-01"),
        contenu: "Deuxième objectif",
      });

      // When
      const result = await query.run(chantier.id, TYPE);

      // Then
      expect(result).toEqual([
        expect.objectContaining({
          contenu: "Deuxième objectif",
          auteurModificationNom: "Jean Dupont",
        }),
        expect.objectContaining({
          contenu: "Premier objectif",
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
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Objectif publié",
        statut: $Enums.statut_publication.PUBLIE,
      });
      // Brouillon ne doit pas apparaître dans l'historique
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Brouillon",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, TYPE);

      // Then
      expect(result).toEqual([
        expect.objectContaining({ contenu: "Objectif publié" }),
      ]);
    }),
  );

  it(
    "exclut les objectifs d'un autre type",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Objectif du bon type",
      });
      // Autre type ne doit pas apparaître
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: "deja_fait",
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Objectif d'un autre type",
      });

      // When
      const result = await query.run(chantier.id, TYPE);

      // Then
      expect(result).toEqual([
        expect.objectContaining({ contenu: "Objectif du bon type" }),
      ]);
    }),
  );

  it(
    "retourne les objectifs dans l'ordre décroissant par date_modification",
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
        contenu: "Objectif ancien",
      });
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-06-01"),
        contenu: "Objectif récent",
      });

      // When
      const result = await query.run(chantier.id, TYPE);

      // Then
      expect(result).toEqual([
        expect.objectContaining({ contenu: "Objectif récent" }),
        expect.objectContaining({ contenu: "Objectif ancien" }),
      ]);
    }),
  );
});
