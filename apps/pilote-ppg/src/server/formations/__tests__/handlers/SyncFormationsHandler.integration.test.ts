import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PrismaTransaction } from "@/server/framework/persistence/PrismaTransaction";
import {
  SyncFormationsHandler,
  type SyncFormationsCommand,
} from "@/server/formations/handlers/SyncFormationsHandler";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

const URL_INSCRIPTION =
  "https://rdv.anct.gouv.fr/users/rdv_wizard_step/new?rdv_collectif_id=11";

const seance = (
  overrides: Partial<SyncFormationsCommand["seances"][number]> = {},
): SyncFormationsCommand["seances"][number] => ({
  id: 11,
  motif_id: 1,
  date_debut: "2026-12-03T09:30:00+01:00",
  duree_minutes: 90,
  animateurs: [],
  cancelled_at: null,
  nombre_places_max: null,
  nombre_inscrits: 0,
  url_inscription: URL_INSCRIPTION,
  ...overrides,
});

describe("SyncFormationsHandler", () => {
  const maintenant = new Date("2026-11-19T05:00:00Z");
  let handler: SyncFormationsHandler;

  beforeEach(() => {
    handler = new SyncFormationsHandler({
      prisma: new PrismaPilote(),
      transaction: new PrismaTransaction(),
    });
  });

  it(
    "crée les motifs et les séances reçus",
    createIntegrationTest(async (prisma) => {
      // When
      const resultat = await handler.execute({
        commande: {
          motifs: [
            { id: 1, nom: "Introduction" },
            { id: 2, nom: "Import" },
          ],
          seances: [
            seance({
              animateurs: ["Camille Martin"],
              nombre_places_max: 20,
              nombre_inscrits: 12,
            }),
          ],
        },
        maintenant,
      });

      // Then
      expect(resultat).toEqual({
        motifs: { ecrits: 2, retires: 0 },
        seances: { ecrites: 1 },
      });
      expect(
        await prisma.formation_motif.findMany({
          select: { id: true, nom: true, deleted_at: true },
          orderBy: { id: "asc" },
        }),
      ).toEqual([
        { id: BigInt(1), nom: "Introduction", deleted_at: null },
        { id: BigInt(2), nom: "Import", deleted_at: null },
      ]);
      expect(
        await prisma.formation_seance.findMany({
          omit: { created_at: true, updated_at: true },
        }),
      ).toEqual([
        {
          id: BigInt(11),
          motif_id: BigInt(1),
          date_debut: new Date("2026-12-03T08:30:00Z"),
          duree_minutes: 90,
          animateurs: ["Camille Martin"],
          cancelled_at: null,
          nombre_places_max: 20,
          nombre_inscrits: 12,
          url_inscription: URL_INSCRIPTION,
        },
      ]);
    }),
  );

  it(
    "ignore les noms d'animateurs absents ou vides",
    createIntegrationTest(async (prisma) => {
      // When
      await handler.execute({
        commande: {
          motifs: [{ id: 1, nom: "Introduction" }],
          seances: [
            seance({ id: 11, animateurs: null }),
            seance({ id: 12, animateurs: [null, " ", " Camille Martin "] }),
          ],
        },
        maintenant,
      });

      // Then
      expect(
        await prisma.formation_seance.findMany({
          select: { id: true, animateurs: true },
          orderBy: { id: "asc" },
        }),
      ).toEqual([
        { id: BigInt(11), animateurs: [] },
        { id: BigInt(12), animateurs: ["Camille Martin"] },
      ]);
    }),
  );

  it(
    "met à jour un motif connu sans toucher à sa date de création, et le réactive s'il était retiré",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({
        id: BigInt(1),
        nom: "Ancien nom",
        created_at: new Date("2026-01-01T00:00:00Z"),
        deleted_at: new Date("2026-11-01T00:00:00Z"),
      });

      // When
      await handler.execute({
        commande: { motifs: [{ id: 1, nom: "Nouveau nom" }], seances: [] },
        maintenant,
      });

      // Then
      expect(
        await prisma.formation_motif.findMany({
          select: { id: true, nom: true, created_at: true, deleted_at: true },
        }),
      ).toEqual([
        {
          id: BigInt(1),
          nom: "Nouveau nom",
          created_at: new Date("2026-01-01T00:00:00Z"),
          deleted_at: null,
        },
      ]);
    }),
  );

  it(
    "retire les motifs absents de l'envoi et garde le paramétrage qui les cite",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      await fixtures.formationMotif({ id: BigInt(2) });
      // Le motif 3 était déjà retiré : il garde sa date de retrait
      await fixtures.formationMotif({
        id: BigInt(3),
        deleted_at: new Date("2026-11-01T00:00:00Z"),
      });
      await prisma.formation_motif_profil.create({
        data: { motif_id: BigInt(2), profil_code: "DITP_ADMIN" },
      });
      const periode = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-12-01T00:00:00Z"),
        date_fin: new Date("2026-12-31T00:00:00Z"),
        motifIds: [BigInt(2)],
      });

      // When
      const resultat = await handler.execute({
        commande: { motifs: [{ id: 1, nom: "Introduction" }], seances: [] },
        maintenant,
      });

      // Then
      expect(resultat).toEqual({
        motifs: { ecrits: 1, retires: 1 },
        seances: { ecrites: 0 },
      });
      expect(
        await prisma.formation_motif.findMany({
          select: { id: true, deleted_at: true },
          orderBy: { id: "asc" },
        }),
      ).toEqual([
        { id: BigInt(1), deleted_at: null },
        { id: BigInt(2), deleted_at: maintenant },
        { id: BigInt(3), deleted_at: new Date("2026-11-01T00:00:00Z") },
      ]);
      expect(
        await prisma.formation_motif_profil.findMany({
          select: { motif_id: true, profil_code: true },
        }),
      ).toEqual([{ motif_id: BigInt(2), profil_code: "DITP_ADMIN" }]);
      expect(
        await prisma.formation_periode_information_motif.findMany({
          select: { periode_id: true, motif_id: true },
        }),
      ).toEqual([{ periode_id: periode.id, motif_id: BigInt(2) }]);
    }),
  );

  it(
    "remplace toutes les séances par celles de l'envoi",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      await fixtures.formationSeance({
        id: BigInt(11),
        motif_id: BigInt(1),
        nombre_inscrits: 3,
      });
      await fixtures.formationSeance({
        id: BigInt(12),
        motif_id: BigInt(1),
        nombre_inscrits: 3,
      });

      // When
      await handler.execute({
        commande: {
          motifs: [{ id: 1, nom: "Introduction" }],
          seances: [
            seance({ id: 12, nombre_inscrits: 8 }),
            seance({ id: 13, nombre_inscrits: 0 }),
          ],
        },
        maintenant,
      });

      // Then
      expect(
        await prisma.formation_seance.findMany({
          select: { id: true, nombre_inscrits: true },
          orderBy: { id: "asc" },
        }),
      ).toEqual([
        { id: BigInt(12), nombre_inscrits: 8 },
        { id: BigInt(13), nombre_inscrits: 0 },
      ]);
    }),
  );

  it(
    "donne le même état quand on rejoue le même envoi",
    createIntegrationTest(async (prisma) => {
      // Given
      const commande: SyncFormationsCommand = {
        motifs: [
          { id: 1, nom: "Introduction" },
          { id: 2, nom: "Import" },
        ],
        seances: [seance({ animateurs: ["Camille Martin"] })],
      };
      const etat = async () => ({
        motifs: await prisma.formation_motif.findMany({
          select: { id: true, nom: true, deleted_at: true, created_at: true },
          orderBy: { id: "asc" },
        }),
        seances: await prisma.formation_seance.findMany({
          omit: { created_at: true, updated_at: true },
          orderBy: { id: "asc" },
        }),
      });
      await handler.execute({ commande, maintenant });
      const etatApresPremierEnvoi = await etat();

      // When
      const resultat = await handler.execute({ commande, maintenant });

      // Then
      expect(resultat).toEqual({
        motifs: { ecrits: 2, retires: 0 },
        seances: { ecrites: 1 },
      });
      expect(await etat()).toEqual(etatApresPremierEnvoi);
    }),
  );
});
