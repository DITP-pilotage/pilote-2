import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererRapportHebdomadaireQuery } from "@/server/rapports-hebdomadaires/queries/RecupererRapportHebdomadaireQuery";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { type ContenuRapport } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PrismaRapportRepository";

describe("RecupererRapportHebdomadaireQuery", () => {
  let query: RecupererRapportHebdomadaireQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererRapportHebdomadaireQuery({ prisma: prismaPilote });
  });

  it(
    "retourne le détail complet du rapport avec le contenuRapport parsé",
    createIntegrationTest(async () => {
      // Given
      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });

      const contenuRapport: ContenuRapport = {
        coordinateur: {
          id: coordinateur.id,
          email: "coordinateur@example.com",
          nom: "Dupont",
          prenom: "Jean",
          profil: "COORDINATEUR_REGION",
          territoires: [
            {
              code: "REG-11",
              nom: "Île-de-France",
              maille: "REG",
              enfants: [],
            },
          ],
        },
        sectionActiviteComptes: {
          comptesCrees: [
            {
              email: "test@example.com",
              nom: "Test",
              prenom: "User",
              profil: "PREFET_REGION",
              territoires: [
                {
                  code: "REG-11",
                  nom: "Île-de-France",
                  maille: "REG",
                  enfants: [],
                },
              ],
            },
          ],
          comptesDesactives: [],
        },
        sectionActiviteChantiers: [
          {
            id: "CH-001",
            nom: "Chantier Test",
            indicateurs: [
              {
                id: "IND-001",
                nom: "Indicateur Test",
                territoires: [
                  {
                    code: "REG-11",
                    nom: "Île-de-France",
                    typeValeur: "VALEUR_AVANCEMENT",
                    valeur: 75,
                    dateValeur: "2024-01-15",
                    dateEvenement: "2024-01-16",
                  },
                ],
              },
            ],
          },
        ],
      };

      const rapport = await fixtures.rapportHebdomadaireCoordinateur({
        coordinateur_id: coordinateur.id,
        date_debut_periode: new Date("2024-01-15"),
        date_fin_periode: new Date("2024-01-21"),
        statut_envoi: "CREE",
        contenu_rapport: contenuRapport,
      });

      // When
      const result = await query.run(rapport.id, coordinateur.id);

      // Then
      expect(result).toEqual({
        id: rapport.id,
        periodeDebut: new Date("2024-01-15"),
        periodeFin: new Date("2024-01-21"),
        statutEnvoi: "CREE",
        dateCreation: rapport.date_creation,
        contenuRapport,
      });
    }),
  );

  it(
    "lance une NotFoundError quand le rapport n'existe pas",
    createIntegrationTest(async () => {
      // Given
      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      const nonExistentRapportId = randomUUID();

      // When / Then
      await expect(
        query.run(nonExistentRapportId, coordinateur.id),
      ).rejects.toThrow(NotFoundError);
      await expect(
        query.run(nonExistentRapportId, coordinateur.id),
      ).rejects.toThrow("Rapport hebdomadaire non trouvé");
    }),
  );

  it(
    "lance une NotFoundError quand le rapport appartient à un autre coordinateur",
    createIntegrationTest(async () => {
      // Given
      const coordinateur1 = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      const coordinateur2 = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });

      const rapport = await fixtures.rapportHebdomadaireCoordinateur({
        coordinateur_id: coordinateur1.id,
        date_debut_periode: new Date("2024-01-15"),
        date_fin_periode: new Date("2024-01-21"),
      });

      // When / Then
      await expect(query.run(rapport.id, coordinateur2.id)).rejects.toThrow(
        NotFoundError,
      );
      await expect(query.run(rapport.id, coordinateur2.id)).rejects.toThrow(
        "Rapport hebdomadaire non trouvé",
      );
    }),
  );
});
