// Données fictives des formations RDV-SP, pour développer en local avant que copilot
// n'écrive les vraies. Lancé à la main (`pnpm database:seed:formations`), jamais par
// `prisma db seed` ni par le build : ce dernier tourne aussi en production.
import { prisma } from "@/server/framework/persistence/prisma";

const BASE_LOCALE = /@(localhost|127\.0\.0\.1)(:[0-9]+)?\//;

const URL_INSCRIPTION =
  "https://rdv.anct.gouv.fr/prendre_rdv?departement=&public_link_organisation_id=1453";

const INTRODUCTION = BigInt(900001);
const COMMENTAIRES = BigInt(900002);
const ROLES = BigInt(900003);
const IMPORT = BigInt(900004);
const ASSISTANT_IA = BigInt(900005);
const COORDINATEUR = BigInt(900006);

const MOTIFS = [
  { id: INTRODUCTION, nom: "CAMPUS PILOTE : Introduction à l'outil" },
  {
    id: COMMENTAIRES,
    nom: "CAMPUS PILOTE : Saisir des commentaires dans l'outil",
  },
  {
    id: ROLES,
    nom: "CAMPUS PILOTE : Le rôle de chaque acteur (Qui saisit quoi dans l'outil)",
  },
  {
    id: IMPORT,
    nom: "CAMPUS PILOTE : Importer des données pour les indicateurs",
  },
  { id: ASSISTANT_IA, nom: "CAMPUS PILOTE : Maîtriser l'Assistant IA" },
  {
    id: COORDINATEUR,
    nom: "CAP sur PILOTE : Devenir un coordinateur efficace",
  },
];

// Matrice motif ↔ profils validée dans PIL-1883.
const PROFILS_FORMATIONS_GENERALES = [
  "COORDINATEUR_REGION",
  "COORDINATEUR_DEPARTEMENT",
  "DIR_ADMIN_CENTRALE",
  "PREFET_DEPARTEMENT",
  "PREFET_REGION",
  "SERVICES_DECONCENTRES_DEPARTEMENT",
  "SERVICES_DECONCENTRES_REGION",
  "SECRETARIAT_GENERAL",
  "EQUIPE_DIR_PROJET",
  "DITP_ADMIN",
  "DITP_PILOTAGE",
];

const PROFILS_PAR_MOTIF: [bigint, string[]][] = [
  [INTRODUCTION, PROFILS_FORMATIONS_GENERALES],
  [COMMENTAIRES, PROFILS_FORMATIONS_GENERALES],
  [ROLES, PROFILS_FORMATIONS_GENERALES],
  [ASSISTANT_IA, PROFILS_FORMATIONS_GENERALES],
  [
    IMPORT,
    [
      "DIR_ADMIN_CENTRALE",
      "SECRETARIAT_GENERAL",
      "EQUIPE_DIR_PROJET",
      "DITP_ADMIN",
      "DITP_PILOTAGE",
    ],
  ],
  [
    COORDINATEUR,
    [
      "COORDINATEUR_REGION",
      "COORDINATEUR_DEPARTEMENT",
      "DITP_ADMIN",
      "DITP_PILOTAGE",
    ],
  ],
];

type SeanceFictive = {
  id: number;
  motifId: bigint;
  decalageJours: number;
  nombreInscrits: number;
  nombrePlacesMax: number | null;
  annulee?: boolean;
};

const SEANCES: SeanceFictive[] = [
  {
    id: 910001,
    motifId: INTRODUCTION,
    decalageJours: 2,
    nombreInscrits: 8,
    nombrePlacesMax: 30,
  },
  {
    id: 910002,
    motifId: INTRODUCTION,
    decalageJours: 16,
    nombreInscrits: 0,
    nombrePlacesMax: 30,
  },
  {
    id: 910003,
    motifId: COMMENTAIRES,
    decalageJours: 3,
    nombreInscrits: 30,
    nombrePlacesMax: 30,
  },
  {
    id: 910004,
    motifId: COMMENTAIRES,
    decalageJours: 10,
    nombreInscrits: 5,
    nombrePlacesMax: 30,
  },
  {
    id: 910005,
    motifId: ROLES,
    decalageJours: 9,
    nombreInscrits: 2,
    nombrePlacesMax: null,
  },
  {
    id: 910006,
    motifId: IMPORT,
    decalageJours: -5,
    nombreInscrits: 18,
    nombrePlacesMax: 30,
  },
  {
    id: 910007,
    motifId: ASSISTANT_IA,
    decalageJours: 4,
    nombreInscrits: 12,
    nombrePlacesMax: 30,
    annulee: true,
  },
  {
    id: 910008,
    motifId: ASSISTANT_IA,
    decalageJours: 11,
    nombreInscrits: 3,
    nombrePlacesMax: 30,
  },
  {
    id: 910009,
    motifId: COORDINATEUR,
    decalageJours: 7,
    nombreInscrits: 10,
    nombrePlacesMax: 20,
  },
];

const PERIODES = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    decalageDebut: -7,
    decalageFin: 30,
    motifs: [INTRODUCTION, COMMENTAIRES, ASSISTANT_IA, COORDINATEUR],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    decalageDebut: -90,
    decalageFin: -60,
    motifs: [INTRODUCTION],
  },
];

function aujourdhuiDecale(decalageJours: number, heure = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + decalageJours);
  date.setHours(heure, 0, 0, 0);
  return date;
}

// Une colonne `@db.Date` garde le jour UTC : on construit minuit UTC du jour local.
function jourDecale(decalageJours: number): Date {
  const date = aujourdhuiDecale(decalageJours);
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

async function main() {
  if (!BASE_LOCALE.test(process.env.DATABASE_URL ?? "")) {
    // eslint-disable-next-line no-console
    console.error(
      "seed-formations : DATABASE_URL ne pointe pas sur une base locale, abandon.",
    );
    process.exit(1);
  }

  const idsMotifs = MOTIFS.map((motif) => motif.id);
  const idsPeriodes = PERIODES.map((periode) => periode.id);

  // Un tunnel vers la recette ou la prod expose aussi la base sur 127.0.0.1 : des motifs
  // ou des périodes hors du jeu fictif signalent un vrai environnement.
  const [motifsHorsJeu, periodesHorsJeu] = await Promise.all([
    prisma.formation_motif.count({ where: { id: { notIn: idsMotifs } } }),
    prisma.formation_periode_information.count({
      where: { id: { notIn: idsPeriodes } },
    }),
  ]);
  if (motifsHorsJeu > 0 || periodesHorsJeu > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `seed-formations : la base contient ${motifsHorsJeu} motif(s) et ${periodesHorsJeu} période(s) hors du jeu fictif, abandon.`,
    );
    process.exit(1);
  }

  await prisma.$transaction(async (transaction) => {
    // Les suppressions en cascade emportent les séances, les motifs des périodes et
    // les lignes d'état de la slide-in rattachées à ces lignes.
    await transaction.formation_periode_information.deleteMany({
      where: { id: { in: idsPeriodes } },
    });
    await transaction.formation_motif_profil.deleteMany({
      where: { motif_id: { in: idsMotifs } },
    });
    await transaction.formation_motif.deleteMany({
      where: { id: { in: idsMotifs } },
    });

    await transaction.formation_motif.createMany({ data: MOTIFS });
    await transaction.formation_motif_profil.createMany({
      data: PROFILS_PAR_MOTIF.flatMap(([motifId, profils]) =>
        profils.map((profilCode) => ({
          motif_id: motifId,
          profil_code: profilCode,
        })),
      ),
    });
    await transaction.formation_seance.createMany({
      data: SEANCES.map((seance) => ({
        id: BigInt(seance.id),
        motif_id: seance.motifId,
        date_debut: aujourdhuiDecale(seance.decalageJours, 14),
        duree_minutes: 45,
        lieu: "Visioconférence",
        animateurs: "Équipe PILOTE",
        statut: seance.annulee ? "revoked" : "unknown",
        date_annulation: seance.annulee ? aujourdhuiDecale(-1, 9) : null,
        nombre_places_max: seance.nombrePlacesMax,
        nombre_inscrits: seance.nombreInscrits,
        url_inscription: URL_INSCRIPTION,
      })),
    });
    await transaction.formation_periode_information.createMany({
      data: PERIODES.map((periode) => ({
        id: periode.id,
        date_debut: jourDecale(periode.decalageDebut),
        date_fin: jourDecale(periode.decalageFin),
      })),
    });
    await transaction.formation_periode_information_motif.createMany({
      data: PERIODES.flatMap((periode) =>
        periode.motifs.map((motifId) => ({
          periode_id: periode.id,
          motif_id: motifId,
        })),
      ),
    });
  });

  // eslint-disable-next-line no-console
  console.log("Données fictives des formations chargées.");
}

main().catch((erreur) => {
  // eslint-disable-next-line no-console
  console.error(erreur);
  process.exit(1);
});
