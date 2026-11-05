import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetChantierIndicateursQuery } from "@/server/chantiers/query/GetChantierIndicateursQuery";

describe("GetChantierIndicateursQuery", () => {
  const query = new GetChantierIndicateursQuery({ prisma: new PrismaPilote() });

  const creerIndicateur = async (responsablesDonneesMails: string[]) => {
    await fixtures.chantierIdentite({ id: "CH-001" });
    await fixtures.chantierTerritoire({
      id: "CH-001",
      territoire_code: "NAT-FR",
      code_insee: "FR",
      maille: "NAT",
      zone_id: "FRANCE",
    });
    await fixtures.indicateurIdentite({
      id: "IND-001",
      chantier_id: "CH-001",
      statut: "PUBLIE",
      responsables_donnees_mails: responsablesDonneesMails,
    });
    await fixtures.indicateurTerritoire({
      id: "IND-001",
      chantier_id: "CH-001",
      territoire_code: "NAT-FR",
    });
  };

  const executer = () =>
    query.execute({
      territoireCode: "NAT-FR",
      chantierId: "CH-001",
      jalon: 2025,
    });

  it(
    "retrouve le responsable des données par son e-mail, sans tenir compte de la casse",
    createIntegrationTest(async () => {
      // Given
      const responsable = await fixtures.utilisateur({
        email: "jeanne.martin@modernisation.gouv.fr",
      });
      await creerIndicateur(["Jeanne.Martin@Modernisation.gouv.fr"]);

      // When
      const result = await executer();

      // Then
      expect(result.indicateurs).toEqual([
        expect.objectContaining({
          indicateur_id: "IND-001",
          responsables_donnees_ids: [responsable.id],
        }),
      ]);
    }),
  );

  it(
    "omet un e-mail qui ne correspond à aucun compte, sans jamais renvoyer d'e-mail",
    createIntegrationTest(async () => {
      // Given
      await creerIndicateur(["inconnu@modernisation.gouv.fr"]);

      // When
      const result = await executer();

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
