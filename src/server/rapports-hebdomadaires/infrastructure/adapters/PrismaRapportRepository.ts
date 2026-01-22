import { $Enums, Prisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RapportRepository } from "@/server/rapports-hebdomadaires/domain/ports/RapportRepository";
import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";
import { StatutEnvoi } from "@/server/rapports-hebdomadaires/domain/StatutEnvoi";
import { ProfilCoordinateur } from "@/server/rapports-hebdomadaires/domain/Coordinateur";
import { CompteActivite } from "@/server/rapports-hebdomadaires/domain/CompteActivite";

interface Dependencies {
  prisma: PrismaPilote;
}

export class PrismaRapportRepository implements RapportRepository {
  constructor(private readonly deps: Dependencies) {}

  async sauvegarder(params: {
    rapport: RapportHebdomadaire;
  }): Promise<RapportHebdomadaire> {
    const { rapport } = params;
    const prisma = this.deps.prisma.getInstance();

    const created = await prisma.rapport_hebdomadaire_coordinateur.create({
      data: {
        coordinateur_id: rapport.coordinateur.id,
        coordinateur_email: rapport.coordinateur.email,
        coordinateur_nom: rapport.coordinateur.nom,
        coordinateur_prenom: rapport.coordinateur.prenom,
        coordinateur_profil: rapport.coordinateur.profil,
        territoire_code: rapport.coordinateur.territoire.code,
        territoire_nom: rapport.coordinateur.territoire.nom,
        date_debut_periode: rapport.periode.dateDebut,
        date_fin_periode: rapport.periode.dateFin,
        comptes_crees: rapport.sectionActiviteComptes
          .comptesCreés as unknown as Prisma.InputJsonValue,
        comptes_desactives: rapport.sectionActiviteComptes
          .comptesDésactivés as unknown as Prisma.InputJsonValue,
        statut_envoi: this.mapStatutToPrisma(rapport.statutEnvoi),
      },
    });

    return { ...rapport, id: created.id };
  }

  async mettreAJour(params: {
    rapport: RapportHebdomadaire;
  }): Promise<RapportHebdomadaire> {
    const { rapport } = params;
    if (!rapport.id) throw new Error("Cannot update rapport without id");

    const prisma = this.deps.prisma.getInstance();

    await prisma.rapport_hebdomadaire_coordinateur.update({
      where: { id: rapport.id },
      data: {
        statut_envoi: this.mapStatutToPrisma(rapport.statutEnvoi),
        date_envoi: rapport.dateEnvoi,
        date_derniere_tentative: rapport.dateDerniereTentative,
        nombre_tentatives: rapport.nombreTentatives,
        erreur_envoi: rapport.erreurEnvoi,
      },
    });

    return rapport;
  }

  async recupererRapportsParStatut(params: {
    statut: StatutEnvoi;
    dateCreationMin?: Date;
  }): Promise<RapportHebdomadaire[]> {
    const prisma = this.deps.prisma.getInstance();

    const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
      where: {
        statut_envoi: this.mapStatutToPrisma(params.statut),
        ...(params.dateCreationMin && {
          date_creation: { gte: params.dateCreationMin },
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
          territoire: {
            code: row.territoire_code,
            nom: row.territoire_nom,
            maille:
              row.coordinateur_profil === "COORDINATEUR_REGION"
                ? "REG"
                : "DEPT",
            codesEnfants: [],
          },
        },
        periode: {
          dateDebut: row.date_debut_periode,
          dateFin: row.date_fin_periode,
        },
        sectionActiviteComptes: {
          comptesCreés: row.comptes_crees as unknown as CompteActivite[],
          comptesDésactivés:
            row.comptes_desactives as unknown as CompteActivite[],
        },
        statutEnvoi: row.statut_envoi as StatutEnvoi,
        dateCreation: row.date_creation,
        dateEnvoi: row.date_envoi ?? undefined,
        dateDerniereTentative: row.date_derniere_tentative ?? undefined,
        nombreTentatives: row.nombre_tentatives,
        erreurEnvoi: row.erreur_envoi ?? undefined,
      }),
    );
  }

  private mapStatutToPrisma(statut: StatutEnvoi): $Enums.statut_envoi_rapport {
    return statut as $Enums.statut_envoi_rapport;
  }
}
