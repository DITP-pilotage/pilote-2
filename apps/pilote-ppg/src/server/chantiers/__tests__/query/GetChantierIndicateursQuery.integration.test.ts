import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetChantierIndicateursQuery } from "@/server/chantiers/query/GetChantierIndicateursQuery";

describe("GetChantierIndicateursQuery", () => {
  const query = new GetChantierIndicateursQuery({ prisma: new PrismaPilote() });

  const creerIndicateur = async (responsablesDonneesMails: string[]) => {
    const chantier = await fixtures.chantierIdentite();
    await fixtures.chantierTerritoire({
      id: chantier.id,
      territoire_code: "NAT-FR",
      code_insee: "FR",
      maille: "NAT",
      zone_id: "FRANCE",
    });
    const indicateur = await fixtures.indicateurIdentite({
      chantier_id: chantier.id,
      statut: "PUBLIE",
      responsables_donnees_mails: responsablesDonneesMails,
    });
    await fixtures.indicateurTerritoire({
      id: indicateur.id,
      chantier_id: chantier.id,
      territoire_code: "NAT-FR",
    });
    return { chantier, indicateur };
  };

  const executer = (chantierId: string) =>
    query.execute({
      territoireCode: "NAT-FR",
      chantierId,
      jalon: 2025,
    });

  it(
    "retrouve le responsable des données par son e-mail, sans tenir compte de la casse",
    createIntegrationTest(async () => {
      // Given
      const responsable = await fixtures.utilisateur({
        email: "jeanne.martin@modernisation.gouv.fr",
      });
      const { chantier, indicateur } = await creerIndicateur([
        "Jeanne.Martin@Modernisation.gouv.fr",
      ]);

      // When
      const result = await executer(chantier.id);

      // Then
      expect(result.indicateurs).toEqual([
        expect.objectContaining({
          indicateur_id: indicateur.id,
          responsables_donnees_ids: [responsable.id],
        }),
      ]);
    }),
  );

  it(
    "omet un e-mail qui ne correspond à aucun compte, sans jamais renvoyer d'e-mail",
    createIntegrationTest(async () => {
      // Given
      const { chantier } = await creerIndicateur([
        "inconnu@modernisation.gouv.fr",
      ]);

      // When
      const result = await executer(chantier.id);

      // Then
      expect(result.indicateurs).toEqual([
        expect.objectContaining({ responsables_donnees_ids: [] }),
      ]);
      expect(JSON.stringify(result)).not.toContain(
        "inconnu@modernisation.gouv.fr",
      );
    }),
  );
});
