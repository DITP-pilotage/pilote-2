import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererBrouillonObjectifQuery } from "@/server/objectifs/queries/RecupererBrouillonObjectifQuery";

const TYPE = "notreAmbition" as const;
const TYPE_DB = "notre_ambition" as const;

describe("RecupererBrouillonObjectifQuery", () => {
  let query: RecupererBrouillonObjectifQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererBrouillonObjectifQuery({ prisma: prismaPilote });
  });

  it(
    "retourne null pour tous les types quand aucun brouillon n'existe",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();

      // When
      const result = await query.run(chantier.id, auteur.id);

      // Then
      expect(Object.values(result).every((value) => value === null)).toBe(true);
    }),
  );

  it(
    "retourne null pour un type quand le brouillon appartient à un autre auteur",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const autreAuteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: autreAuteur.id,
        auteur_modification_id: autreAuteur.id,
        contenu: "Brouillon d'un autre auteur",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, auteur.id);

      // Then
      expect(result[TYPE]).toBeNull();
    }),
  );

  it(
    "retourne null pour un type quand le seul objectif est publié",
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

      // When
      const result = await query.run(chantier.id, auteur.id);

      // Then
      expect(result[TYPE]).toBeNull();
    }),
  );

  it(
    "retourne le brouillon de l'auteur pour le bon type",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      const brouillon = await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Mon brouillon",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, auteur.id);

      // Then
      expect(result[TYPE]).toEqual({
        id: brouillon.id,
        chantierId: chantier.id,
        type: TYPE,
        contenu: "Mon brouillon",
        statut: $Enums.statut_publication.BROUILLON,
        auteurCreationId: auteur.id,
        dateCreation: expect.any(String),
        auteurModificationId: auteur.id,
        dateModification: expect.any(String),
      });
    }),
  );

  it(
    "retourne le brouillon le plus récent par type si plusieurs existent",
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
        contenu: "Ancien brouillon",
        statut: $Enums.statut_publication.BROUILLON,
      });
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-06-01"),
        contenu: "Brouillon récent",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, auteur.id);

      // Then
      expect(result[TYPE]).toEqual(
        expect.objectContaining({ contenu: "Brouillon récent" }),
      );
    }),
  );

  it(
    "retourne les brouillons pour chaque type indépendamment",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: "notre_ambition",
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Brouillon notre ambition",
        statut: $Enums.statut_publication.BROUILLON,
      });
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: "deja_fait",
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Brouillon déjà fait",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, auteur.id);

      // Then
      expect(result["notreAmbition"]).toEqual(
        expect.objectContaining({ contenu: "Brouillon notre ambition" }),
      );
      expect(result["dejaFait"]).toEqual(
        expect.objectContaining({ contenu: "Brouillon déjà fait" }),
      );
      expect(result["aFaire"]).toBeNull();
    }),
  );
});
