import type { Prisma } from "@prisma/client";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetFormationsAProposerQuery } from "@/server/formations/queries/GetFormationsAProposerQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";

const PROFIL = "COORDINATEUR_REGION";

async function motifDuProfil(
  overrides: Partial<Prisma.formation_motifUncheckedCreateInput> = {},
  profilCode = PROFIL,
) {
  const motif = await fixtures.formationMotif(overrides);
  await getPrisma().formation_motif_profil.create({
    data: { motif_id: motif.id, profil_code: profilCode },
  });
  return motif;
}

function periodeEnCours(
  motifIds: bigint[],
  overrides: Partial<Prisma.formation_periode_informationUncheckedCreateInput> = {},
) {
  return fixtures.formationPeriodeInformation({
    date_debut: new Date("2026-11-01T00:00:00Z"),
    date_fin: new Date("2026-11-30T00:00:00Z"),
    motifIds,
    ...overrides,
  });
}

describe("GetFormationsAProposerQuery", () => {
  const maintenant = new Date("2026-11-23T10:00:00Z");
  let query: GetFormationsAProposerQuery;

  beforeEach(() => {
    query = new GetFormationsAProposerQuery({ prisma: new PrismaPilote() });
  });

  async function donneesDePresentation() {
    const utilisateur = await fixtures.utilisateur({ profilCode: PROFIL });
    const motifA = await motifDuProfil({
      nom: "CAMPUS PILOTE : Introduction à l'outil",
    });
    const motifB = await motifDuProfil({
      nom: "CAMPUS PILOTE : Maîtriser l'Assistant IA",
    });
    const seanceA2 = await fixtures.formationSeance({
      motif_id: motifA.id,
      date_debut: new Date("2026-12-03T09:00:00Z"),
    });
    const seanceA1 = await fixtures.formationSeance({
      motif_id: motifA.id,
      date_debut: new Date("2026-11-26T13:00:00Z"),
      nombre_places_max: 20,
      nombre_inscrits: 16,
    });
    const seanceB = await fixtures.formationSeance({
      motif_id: motifB.id,
      date_debut: new Date("2026-11-24T13:00:00Z"),
    });
    const periode = await periodeEnCours([motifA.id, motifB.id]);
    return {
      utilisateur,
      motifA,
      motifB,
      seanceA1,
      seanceA2,
      seanceB,
      periode,
    };
  }

  it(
    "propose les formations du profil avec leurs séances ouvertes, triées par date",
    createIntegrationTest(async () => {
      // Given
      const {
        utilisateur,
        motifA,
        motifB,
        seanceA1,
        seanceA2,
        seanceB,
        periode,
      } = await donneesDePresentation();

      // When
      const resultat = await query.run({
        utilisateurId: utilisateur.id,
        profilCode: PROFIL,
        maintenant,
      });

      // Then
      expect(resultat).toEqual({
        periodeId: periode.id,
        formations: [
          {
            id: Number(motifB.id),
            nom: "CAMPUS PILOTE : Maîtriser l'Assistant IA",
            seances: [
              {
                id: Number(seanceB.id),
                dateDebut: "2026-11-24T13:00:00.000Z",
                dureeMinutes: 45,
                placesRestantes: null,
                urlInscription: seanceB.url_inscription,
              },
            ],
          },
          {
            id: Number(motifA.id),
            nom: "CAMPUS PILOTE : Introduction à l'outil",
            seances: [
              {
                id: Number(seanceA1.id),
                dateDebut: "2026-11-26T13:00:00.000Z",
                dureeMinutes: 45,
                placesRestantes: 4,
                urlInscription: seanceA1.url_inscription,
              },
              {
                id: Number(seanceA2.id),
                dateDebut: "2026-12-03T09:00:00.000Z",
                dureeMinutes: 45,
                placesRestantes: null,
                urlInscription: seanceA2.url_inscription,
              },
            ],
          },
        ],
      });
    }),
  );

  it(
    "écarte les séances commencées, annulées ou complètes, et les formations sans séance ouverte",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur({ profilCode: PROFIL });
      const motifA = await motifDuProfil({ nom: "CAMPUS PILOTE : A" });
      const motifB = await motifDuProfil({ nom: "CAMPUS PILOTE : B" });
      // Commencée une demi-heure avant `maintenant`, pas encore finie
      await fixtures.formationSeance({
        motif_id: motifA.id,
        date_debut: new Date("2026-11-23T09:30:00Z"),
      });
      await fixtures.formationSeance({
        motif_id: motifA.id,
        date_debut: new Date("2026-11-25T13:00:00Z"),
        cancelled_at: new Date("2026-11-20T08:00:00Z"),
      });
      await fixtures.formationSeance({
        motif_id: motifA.id,
        date_debut: new Date("2026-11-26T13:00:00Z"),
        nombre_places_max: 10,
        nombre_inscrits: 10,
      });
      const ouverte = await fixtures.formationSeance({
        motif_id: motifA.id,
        date_debut: new Date("2026-11-27T13:00:00Z"),
      });
      await fixtures.formationSeance({
        motif_id: motifB.id,
        date_debut: new Date("2026-11-25T13:00:00Z"),
        cancelled_at: new Date("2026-11-20T08:00:00Z"),
      });
      const periode = await periodeEnCours([motifA.id, motifB.id]);

      // When
      const resultat = await query.run({
        utilisateurId: utilisateur.id,
        profilCode: PROFIL,
        maintenant,
      });

      // Then
      expect(resultat).toEqual({
        periodeId: periode.id,
        formations: [
          {
            id: Number(motifA.id),
            nom: "CAMPUS PILOTE : A",
            seances: [
              {
                id: Number(ouverte.id),
                dateDebut: "2026-11-27T13:00:00.000Z",
                dureeMinutes: 45,
                placesRestantes: null,
                urlInscription: ouverte.url_inscription,
              },
            ],
          },
        ],
      });
    }),
  );

  it(
    "ne propose pas les formations d'un autre profil ni celles retirées de RDV-SP",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur({ profilCode: PROFIL });
      const autreProfil = await motifDuProfil({}, "DITP_ADMIN");
      const retiree = await motifDuProfil({
        deleted_at: new Date("2026-11-20T08:00:00Z"),
      });
      await fixtures.formationSeance({
        motif_id: autreProfil.id,
        date_debut: new Date("2026-11-25T13:00:00Z"),
      });
      await fixtures.formationSeance({
        motif_id: retiree.id,
        date_debut: new Date("2026-11-25T13:00:00Z"),
      });
      await periodeEnCours([autreProfil.id, retiree.id]);

      // When
      const resultat = await query.run({
        utilisateurId: utilisateur.id,
        profilCode: PROFIL,
        maintenant,
      });

      // Then
      expect(resultat).toBeNull();
    }),
  );

  it(
    "prend la période en cours la plus récemment créée, sans les périodes supprimées",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur({ profilCode: PROFIL });
      const [motif1, motif2, motif3] = await Promise.all([
        motifDuProfil({ nom: "CAMPUS PILOTE : M1" }),
        motifDuProfil({ nom: "CAMPUS PILOTE : M2" }),
        motifDuProfil({ nom: "CAMPUS PILOTE : M3" }),
      ]);
      const seances = await Promise.all(
        [motif1, motif2, motif3].map((motif) =>
          fixtures.formationSeance({
            motif_id: motif.id,
            date_debut: new Date("2026-11-25T13:00:00Z"),
          }),
        ),
      );
      await periodeEnCours([motif1.id], {
        created_at: new Date("2026-11-01T08:00:00Z"),
      });
      const plusRecente = await periodeEnCours([motif2.id], {
        created_at: new Date("2026-11-10T08:00:00Z"),
      });
      await periodeEnCours([motif3.id], {
        created_at: new Date("2026-11-20T08:00:00Z"),
        deleted_at: new Date("2026-11-21T08:00:00Z"),
      });

      // When
      const resultat = await query.run({
        utilisateurId: utilisateur.id,
        profilCode: PROFIL,
        maintenant,
      });

      // Then
      expect(resultat).toEqual({
        periodeId: plusRecente.id,
        formations: [
          {
            id: Number(motif2.id),
            nom: "CAMPUS PILOTE : M2",
            seances: [
              {
                id: Number(seances[1].id),
                dateDebut: "2026-11-25T13:00:00.000Z",
                dureeMinutes: 45,
                placesRestantes: null,
                urlInscription: seances[1].url_inscription,
              },
            ],
          },
        ],
      });
    }),
  );

  it(
    "ne propose rien sans période en cours",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur({ profilCode: PROFIL });
      const motif = await motifDuProfil();
      await fixtures.formationSeance({
        motif_id: motif.id,
        date_debut: new Date("2026-12-05T13:00:00Z"),
      });
      await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-10-01T00:00:00Z"),
        date_fin: new Date("2026-10-31T00:00:00Z"),
        motifIds: [motif.id],
      });
      await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-12-01T00:00:00Z"),
        date_fin: new Date("2026-12-31T00:00:00Z"),
        motifIds: [motif.id],
      });

      // When
      const resultat = await query.run({
        utilisateurId: utilisateur.id,
        profilCode: PROFIL,
        maintenant,
      });

      // Then
      expect(resultat).toBeNull();
    }),
  );

  it(
    "ne propose rien à un utilisateur sans profil",
    createIntegrationTest(async () => {
      // Given
      const { utilisateur } = await donneesDePresentation();

      // When
      const resultat = await query.run({
        utilisateurId: utilisateur.id,
        profilCode: null,
        maintenant,
      });

      // Then
      expect(resultat).toBeNull();
    }),
  );

  it(
    "propose encore les formations déjà présentées, tant que la slide-in n'est pas fermée",
    createIntegrationTest(async (prisma) => {
      // Given
      const { utilisateur, periode } = await donneesDePresentation();
      await prisma.formation_periode_information_utilisateur.create({
        data: {
          utilisateur_id: utilisateur.id,
          periode_id: periode.id,
          date_presentation: new Date("2026-11-19T10:00:00Z"),
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId: utilisateur.id,
        profilCode: PROFIL,
        maintenant,
      });

      // Then
      expect(resultat).toEqual({
        periodeId: periode.id,
        formations: expect.any(Array),
      });
    }),
  );

  it(
    "ne propose rien quand la slide-in est fermée",
    createIntegrationTest(async (prisma) => {
      // Given
      const { utilisateur, periode } = await donneesDePresentation();
      await prisma.formation_periode_information_utilisateur.create({
        data: {
          utilisateur_id: utilisateur.id,
          periode_id: periode.id,
          date_presentation: new Date("2026-11-19T10:00:00Z"),
          date_fermeture: new Date("2026-11-20T10:00:00Z"),
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId: utilisateur.id,
        profilCode: PROFIL,
        maintenant,
      });

      // Then
      expect(resultat).toBeNull();
    }),
  );
});
