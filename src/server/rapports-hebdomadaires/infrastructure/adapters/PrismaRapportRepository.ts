import { $Enums, Prisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RapportRepository } from "@/server/rapports-hebdomadaires/domain/ports/RapportRepository";
import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";
import { ProfilCoordinateur } from "@/server/rapports-hebdomadaires/domain/Coordinateur";
import { CompteActivite } from "@/server/rapports-hebdomadaires/domain/CompteActivite";

export class PrismaRapportRepository implements RapportRepository {
  constructor(
    private readonly deps: {
      prisma: PrismaPilote;
    },
  ) {}

  async sauvegarder(rapport: RapportHebdomadaire): Promise<void> {
    const prisma = this.deps.prisma.getInstance();

    await prisma.rapport_hebdomadaire_coordinateur.upsert({
      where: { id: rapport.id },
      create: {
        id: rapport.id,
        coordinateur_id: rapport.coordinateur.id,
        coordinateur_email: rapport.coordinateur.email,
        coordinateur_nom: rapport.coordinateur.nom,
        coordinateur_prenom: rapport.coordinateur.prenom,
        coordinateur_profil: rapport.coordinateur.profil,
        territoire_code: rapport.coordinateur.territoires[0]?.code ?? "",
        territoire_nom: rapport.coordinateur.territoires[0]?.nom ?? "",
        date_debut_periode: rapport.periode.dateDebut,
        date_fin_periode: rapport.periode.dateFin,
        comptes_crees: rapport.sectionActiviteComptes
          .comptesCrees as unknown as Prisma.InputJsonValue,
        comptes_desactives: rapport.sectionActiviteComptes
          .comptesDesactives as unknown as Prisma.InputJsonValue,
        statut_envoi: rapport.statutEnvoi,
      },
      update: {
        statut_envoi: rapport.statutEnvoi,
        date_envoi: rapport.dateEnvoi,
        date_derniere_tentative: rapport.dateDerniereTentative,
        nombre_tentatives: rapport.nombreTentatives,
        erreur_envoi: rapport.erreurEnvoi,
      },
    });
  }

  async recupererRapportsParStatut(
    statut: $Enums.statut_envoi_rapport,
    dateCreationMin?: Date,
  ): Promise<RapportHebdomadaire[]> {
    const prisma = this.deps.prisma.getInstance();

    const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
      where: {
        statut_envoi: statut,
        ...(dateCreationMin && {
          date_creation: { gte: dateCreationMin },
        }),
      },
    });

    return rapports.map(
      (row): RapportHebdomadaire => ({
        id: row.id,
        coordinateur: {
          id: row.coordinateur_id,
          email: row.coordinateur_email,
          nom: row.coordinateur_nom,
          prenom: row.coordinateur_prenom,
          profil: row.coordinateur_profil as ProfilCoordinateur,
          territoires: [
            {
              code: row.territoire_code,
              nom: row.territoire_nom,
              maille:
                row.coordinateur_profil === "COORDINATEUR_REGION"
                  ? "REG"
                  : "DEPT",
            },
          ],
        },
        periode: {
          dateDebut: row.date_debut_periode,
          dateFin: row.date_fin_periode,
        },
        sectionActiviteComptes: {
          comptesCrees: row.comptes_crees as unknown as CompteActivite[],
          comptesDesactives:
            row.comptes_desactives as unknown as CompteActivite[],
        },
        statutEnvoi: row.statut_envoi,
        dateCreation: row.date_creation,
        dateEnvoi: row.date_envoi ?? undefined,
        dateDerniereTentative: row.date_derniere_tentative ?? undefined,
        nombreTentatives: row.nombre_tentatives,
        erreurEnvoi: row.erreur_envoi ?? undefined,
      }),
    );
  }
}
