import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { toISODate } from "@/server/app/domain/Dates";
import { statutPeriode } from "@/server/formations/domain/periodeInformation";
import { statutSeance } from "@/server/formations/domain/statutSeance";
import { nomAffiche } from "@/server/formations/domain/presentationSlideIn";
import type { Inject } from "@/server/formations/module";

export interface SeanceProposee {
  id: number;
  dateDebut: string;
  dureeMinutes: number;
  placesRestantes: number | null;
  urlInscription: string;
}

export interface FormationProposee {
  id: number;
  nom: string;
  seances: SeanceProposee[];
}

export interface PropositionFormations {
  periodeId: string;
  formations: FormationProposee[];
}

export class GetSlideInFormationsQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({
    utilisateurId,
    profilCode,
    maintenant,
  }: {
    utilisateurId: string;
    profilCode: string | null;
    maintenant: Date;
  }): Promise<PropositionFormations | null> {
    if (profilCode === null) return null;

    const periodeId = await this.periodeEnCours(maintenant);
    if (periodeId === null) return null;

    const formations = await this.formationsProposees({
      periodeId,
      profilCode,
      maintenant,
    });
    if (formations.length === 0) return null;

    // Seul « Ne plus me les proposer » écarte la slide-in : la croix la masque sans rien enregistrer.
    const etat = await this.prisma
      .getInstance()
      .formation_periode_information_utilisateur.findUnique({
        where: {
          utilisateur_id_periode_id: {
            utilisateur_id: utilisateurId,
            periode_id: periodeId,
          },
        },
        select: { date_fermeture: true },
      });

    return etat?.date_fermeture ? null : { periodeId, formations };
  }

  // Sans verrou, deux périodes peuvent être en cours : la plus récemment créée l'emporte.
  private async periodeEnCours(maintenant: Date): Promise<string | null> {
    const aujourdhui = toISODate(maintenant);
    const periodes = await this.prisma
      .getInstance()
      .formation_periode_information.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: "desc" },
      });
    const enCours = periodes.find(
      (periode) =>
        statutPeriode(
          {
            dateDebut: toISODate(periode.date_debut),
            dateFin: toISODate(periode.date_fin),
            supprimee: false,
          },
          aujourdhui,
        ) === "EN_COURS",
    );
    return enCours?.id ?? null;
  }

  private async formationsProposees({
    periodeId,
    profilCode,
    maintenant,
  }: {
    periodeId: string;
    profilCode: string;
    maintenant: Date;
  }): Promise<FormationProposee[]> {
    const motifs = await this.prisma.getInstance().formation_motif.findMany({
      where: {
        deleted_at: null,
        periodes: { some: { periode_id: periodeId } },
        profils: { some: { profil_code: profilCode } },
      },
      include: {
        seances: {
          where: { date_debut: { gt: maintenant } },
          orderBy: [{ date_debut: "asc" }, { id: "asc" }],
        },
      },
    });

    return motifs
      .map((motif) => ({
        id: Number(motif.id),
        nom: nomAffiche(motif.nom),
        seances: motif.seances
          .filter(
            (seance) =>
              statutSeance({
                dateAnnulation: seance.cancelled_at,
                nombreInscrits: seance.nombre_inscrits,
                nombrePlacesMax: seance.nombre_places_max,
              }) === "OUVERTE",
          )
          .map((seance) => ({
            id: Number(seance.id),
            dateDebut: seance.date_debut.toISOString(),
            dureeMinutes: seance.duree_minutes,
            placesRestantes:
              seance.nombre_places_max === null
                ? null
                : seance.nombre_places_max - seance.nombre_inscrits,
            urlInscription: seance.url_inscription,
          })),
      }))
      .filter((formation) => formation.seances.length > 0)
      .sort(
        (premiere, seconde) =>
          premiere.seances[0].dateDebut.localeCompare(
            seconde.seances[0].dateDebut,
          ) || premiere.nom.localeCompare(seconde.nom, "fr"),
      );
  }
}
