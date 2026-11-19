import { z } from "zod";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/formations/module";

// Chaque contrôle porte son message : en production, la carte d'erreurs globale des
// formulaires (src/validation/utilisateur.ts) rendrait sinon « Le champ est requis »
// pour une durée nulle, ou laisserait les formats en anglais.
const DATE_AVEC_FUSEAU = {
  offset: true,
  error:
    "Date ISO 8601 avec fuseau attendue, par exemple 2026-12-03T09:30:00+01:00.",
} as const;

const identifiantRdvSp = z
  .int({ error: "Un identifiant RDV-SP entier est attendu." })
  .positive("Un identifiant RDV-SP strictement positif est attendu.");

const entierPositifOuNul = (nombreNegatif: string) =>
  z.int({ error: "Un nombre entier est attendu." }).nonnegative(nombreNegatif);

const motifSchema = z.object(
  {
    id: identifiantRdvSp,
    nom: z
      .string({ error: "Le nom du motif doit être un texte." })
      .trim()
      .min(1, "Le nom du motif est vide."),
  },
  { error: "Un motif doit être un objet { id, nom }." },
);

const seanceSchema = z.object(
  {
    id: identifiantRdvSp,
    motif_id: identifiantRdvSp,
    date_debut: z.iso.datetime(DATE_AVEC_FUSEAU),
    duree_minutes: z
      .int({ error: "Une durée entière en minutes est attendue." })
      .positive("La durée doit être strictement positive."),
    // Une séance sans agent, ou un agent sans prénom ni nom, ne doit pas bloquer
    // tout l'import : les noms absents ou vides sont ignorés.
    animateurs: z
      .array(
        z
          .string({ error: "Un nom d'animateur doit être un texte." })
          .nullable(),
        { error: "Une liste de noms d'animateurs est attendue." },
      )
      .nullable()
      .transform((noms) =>
        (noms ?? [])
          .map((nom) => nom?.trim() ?? "")
          .filter((nom) => nom.length > 0),
      ),
    cancelled_at: z.iso.datetime(DATE_AVEC_FUSEAU).nullable(),
    nombre_places_max: entierPositifOuNul(
      "Le nombre de places ne peut pas être négatif.",
    ).nullable(),
    nombre_inscrits: entierPositifOuNul(
      "Le nombre d'inscrits ne peut pas être négatif.",
    ),
    url_inscription: z.url({
      protocol: /^https$/,
      error: "Un lien d'inscription en https est attendu.",
    }),
  },
  { error: "Une séance doit être un objet." },
);

export const syncFormationsCommandSchema = z
  .object(
    {
      motifs: z
        .array(motifSchema, { error: "Une liste de motifs est attendue." })
        .min(1, "Au moins un motif est attendu."),
      seances: z.array(seanceSchema, {
        error: "Une liste de séances est attendue.",
      }),
    },
    { error: "Un objet JSON { motifs, seances } est attendu." },
  )
  .superRefine(({ motifs, seances }, contexte) => {
    const motifsVus = new Set<number>();
    motifs.forEach((motif, index) => {
      if (motifsVus.has(motif.id)) {
        contexte.addIssue({
          code: "custom",
          path: ["motifs", index, "id"],
          message: `Le motif ${motif.id} apparaît plusieurs fois.`,
        });
      }
      motifsVus.add(motif.id);
    });

    const seancesVues = new Set<number>();
    seances.forEach((seance, index) => {
      if (seancesVues.has(seance.id)) {
        contexte.addIssue({
          code: "custom",
          path: ["seances", index, "id"],
          message: `La séance ${seance.id} apparaît plusieurs fois.`,
        });
      }
      seancesVues.add(seance.id);
    });

    seances.forEach((seance, index) => {
      if (!motifsVus.has(seance.motif_id)) {
        contexte.addIssue({
          code: "custom",
          path: ["seances", index, "motif_id"],
          message: `Le motif ${seance.motif_id} ne fait pas partie de l'envoi.`,
        });
      }
    });
  });

export type SyncFormationsCommand = z.infer<typeof syncFormationsCommandSchema>;

export interface ResultatSyncFormations {
  motifs: { ecrits: number; retires: number };
  seances: { ecrites: number };
}

export class SyncFormationsHandler {
  private readonly prisma: PrismaPilote;

  private readonly transaction: Inject<"transaction">["transaction"];

  constructor({ prisma, transaction }: Inject<"prisma" | "transaction">) {
    this.prisma = prisma;
    this.transaction = transaction;
  }

  // L'envoi est l'état complet de RDV-SP : les motifs absents sont retirés (jamais
  // effacés, le paramétrage les référence), les séances sont rechargées.
  async execute({
    commande,
    maintenant,
  }: {
    commande: SyncFormationsCommand;
    maintenant: Date;
  }): Promise<ResultatSyncFormations> {
    return this.transaction.run(async () => {
      const client = this.prisma.getInstance();
      const motifIds = commande.motifs.map((motif) => BigInt(motif.id));

      for (const motif of commande.motifs) {
        await client.formation_motif.upsert({
          where: { id: BigInt(motif.id) },
          create: { id: BigInt(motif.id), nom: motif.nom },
          update: { nom: motif.nom, deleted_at: null },
        });
      }
      const { count: retires } = await client.formation_motif.updateMany({
        where: { id: { notIn: motifIds }, deleted_at: null },
        data: { deleted_at: maintenant },
      });

      await client.formation_seance.deleteMany({});
      const { count: ecrites } = await client.formation_seance.createMany({
        data: commande.seances.map((seance) => ({
          id: BigInt(seance.id),
          motif_id: BigInt(seance.motif_id),
          date_debut: new Date(seance.date_debut),
          duree_minutes: seance.duree_minutes,
          animateurs: seance.animateurs,
          cancelled_at: seance.cancelled_at
            ? new Date(seance.cancelled_at)
            : null,
          nombre_places_max: seance.nombre_places_max,
          nombre_inscrits: seance.nombre_inscrits,
          url_inscription: seance.url_inscription,
        })),
      });

      return {
        motifs: { ecrits: commande.motifs.length, retires },
        seances: { ecrites },
      };
    });
  }
}
