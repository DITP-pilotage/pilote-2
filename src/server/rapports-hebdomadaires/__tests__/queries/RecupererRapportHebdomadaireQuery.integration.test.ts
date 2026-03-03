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
    "retourne le détail complet du rapport avec les chantiers et indicateurs triés par identifiant",
    createIntegrationTest(async () => {
      // Given
      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });

      // chantiers and indicateurs are stored in non-id order, and nom is opposite to id order
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
          comptesCrees: [],
          comptesDesactives: [],
        },
        sectionActiviteChantiers: [
          {
            id: "CH-002",
            nom: "Chantier A",
            indicateurs: [
              {
                id: "IND-002",
                nom: "Indicateur A",
                territoires: [
                  {
                    code: "REG-11",
                    nom: "Île-de-France",
                    typeValeur: "VALEUR_AVANCEMENT",
                    valeur: 50,
                    dateValeur: "2024-01-15",
                    dateEvenement: "2024-01-16",
                  },
                ],
              },
              {
                id: "IND-001",
                nom: "Indicateur Z",
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
          {
            id: "CH-001",
            nom: "Chantier Z",
            indicateurs: [
              {
                id: "IND-003",
                nom: "Indicateur Unique",
                territoires: [],
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
        contenuRapport: {
          ...contenuRapport,
          sectionActiviteChantiers: [
            {
              id: "CH-001",
              nom: "Chantier Z",
              indicateurs: [
                {
                  id: "IND-003",
                  nom: "Indicateur Unique",
                  territoires: [],
                },
              ],
            },
            {
              id: "CH-002",
              nom: "Chantier A",
              indicateurs: [
                {
                  id: "IND-001",
                  nom: "Indicateur Z",
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
                {
                  id: "IND-002",
                  nom: "Indicateur A",
                  territoires: [
                    {
                      code: "REG-11",
                      nom: "Île-de-France",
                      typeValeur: "VALEUR_AVANCEMENT",
                      valeur: 50,
                      dateValeur: "2024-01-15",
                      dateEvenement: "2024-01-16",
                    },
                  ],
                },
              ],
            },
          ],
        },
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
