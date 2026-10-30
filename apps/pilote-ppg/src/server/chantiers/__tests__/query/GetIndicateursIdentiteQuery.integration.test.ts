import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetIndicateursIdentiteQuery } from "@/server/chantiers/query/GetIndicateursIdentiteQuery";

describe("GetIndicateursIdentiteQuery", () => {
  const query = new GetIndicateursIdentiteQuery({ prisma: new PrismaPilote() });

  const identite = ({
    indicateur,
    chantier,
  }: {
    indicateur: { id: string; nom: string };
    chantier: { id: string; nom: string };
  }) => ({
    id: indicateur.id,
    nom: indicateur.nom,
    description: null,
    type_nom: expect.any(String),
    est_phare: false,
    chantier: { id: chantier.id, nom: chantier.nom },
  });

  it(
    "ne renvoie que les indicateurs demandés",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      const demande = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
      });
      await fixtures.indicateurIdentite({ chantier_id: chantier.id });

      // When
      const result = await query.execute({ indicateurIds: [demande.id] });

      // Then
      expect(result).toEqual([identite({ indicateur: demande, chantier })]);
    }),
  );

  it(
    "combine indicateurIds et chantierIds",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      const autreChantier = await fixtures.chantierIdentite();
      const demande = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
      });
      const horsChantier = await fixtures.indicateurIdentite({
        chantier_id: autreChantier.id,
      });
      await fixtures.indicateurIdentite({ chantier_id: chantier.id });

      // When
      const result = await query.execute({
        indicateurIds: [demande.id, horsChantier.id],
        chantierIds: [chantier.id],
      });

      // Then
      expect(result).toEqual([identite({ indicateur: demande, chantier })]);
    }),
  );

  it(
    "ne renvoie pas un indicateur demandé non publié",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      const supprime = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        statut: $Enums.type_statut_indicateur.SUPPRIME,
      });

      // When
      const result = await query.execute({ indicateurIds: [supprime.id] });

      // Then
      expect(result).toEqual([]);
    }),
  );
});
