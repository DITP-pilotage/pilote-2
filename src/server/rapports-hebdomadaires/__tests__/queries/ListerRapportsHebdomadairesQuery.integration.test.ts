import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerRapportsHebdomadairesQuery } from "@/server/rapports-hebdomadaires/queries/ListerRapportsHebdomadairesQuery";

describe("ListerRapportsHebdomadairesQuery", () => {
  let query: ListerRapportsHebdomadairesQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerRapportsHebdomadairesQuery({ prisma: prismaPilote });
  });

  it(
    "retourne un tableau vide quand aucun rapport n'existe pour le coordinateur",
    createIntegrationTest(async () => {
      // Given
      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });

      // When
      const result = await query.run(coordinateur.id);

      // Then
      expect(result).toEqual([]);
    }),
  );

  it(
    "retourne les rapports du coordinateur, triés par date_debut_periode décroissante",
    createIntegrationTest(async () => {
      // Given
      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });

      const rapport1 = await fixtures.rapportHebdomadaireCoordinateur({
        coordinateur_id: coordinateur.id,
        date_debut_periode: new Date("2024-01-01"),
        date_fin_periode: new Date("2024-01-07"),
        statut_envoi: "CREE",
      });

      const rapport2 = await fixtures.rapportHebdomadaireCoordinateur({
        coordinateur_id: coordinateur.id,
        date_debut_periode: new Date("2024-01-15"),
        date_fin_periode: new Date("2024-01-21"),
        statut_envoi: "ENVOYE",
      });

      const rapport3 = await fixtures.rapportHebdomadaireCoordinateur({
        coordinateur_id: coordinateur.id,
        date_debut_periode: new Date("2024-01-08"),
        date_fin_periode: new Date("2024-01-14"),
        statut_envoi: "CREE",
      });

      // When
      const result = await query.run(coordinateur.id);

      // Then
      expect(result).toEqual([
        {
          id: rapport2.id,
          periodeDebut: new Date("2024-01-15"),
          periodeFin: new Date("2024-01-21"),
          statutEnvoi: "ENVOYE",
          dateCreation: rapport2.date_creation,
        },
        {
          id: rapport3.id,
          periodeDebut: new Date("2024-01-08"),
          periodeFin: new Date("2024-01-14"),
          statutEnvoi: "CREE",
          dateCreation: rapport3.date_creation,
        },
        {
          id: rapport1.id,
          periodeDebut: new Date("2024-01-01"),
          periodeFin: new Date("2024-01-07"),
          statutEnvoi: "CREE",
          dateCreation: rapport1.date_creation,
        },
      ]);
    }),
  );

  it(
    "ne retourne pas les rapports d'un autre coordinateur",
    createIntegrationTest(async () => {
      // Given
      const coordinateur1 = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      const coordinateur2 = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });

      await fixtures.rapportHebdomadaireCoordinateur({
        coordinateur_id: coordinateur1.id,
        date_debut_periode: new Date("2024-01-01"),
        date_fin_periode: new Date("2024-01-07"),
      });

      const rapport2 = await fixtures.rapportHebdomadaireCoordinateur({
        coordinateur_id: coordinateur2.id,
        date_debut_periode: new Date("2024-01-08"),
        date_fin_periode: new Date("2024-01-14"),
      });

      // When
      const result = await query.run(coordinateur2.id);

      // Then
      expect(result).toEqual([
        {
          id: rapport2.id,
          periodeDebut: new Date("2024-01-08"),
          periodeFin: new Date("2024-01-14"),
          statutEnvoi: rapport2.statut_envoi,
          dateCreation: rapport2.date_creation,
        },
      ]);
    }),
  );
});
