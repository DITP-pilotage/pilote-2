import { $Enums, Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RapportRepository } from "@/server/rapports-hebdomadaires/domain/ports/RapportRepository";
import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";
import {
  Coordinateur,
  ProfilCoordinateur,
} from "@/server/rapports-hebdomadaires/domain/Coordinateur";
import { SectionActiviteComptes } from "@/server/rapports-hebdomadaires/domain/SectionActiviteComptes";
import { SectionActiviteChantiersVA } from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiersVA";

const contenuRapportSchema = z.object({
  coordinateur: z.custom<Coordinateur>(),
  sectionActiviteComptes: z.custom<SectionActiviteComptes>(),
  sectionActiviteChantiersVA: z.custom<SectionActiviteChantiersVA>(),
});

export type ContenuRapport = z.infer<typeof contenuRapportSchema>;

export class PrismaRapportRepository implements RapportRepository {
  constructor(
    private readonly deps: {
      prisma: PrismaPilote;
    },
  ) {}

  async sauvegarder(rapport: RapportHebdomadaire): Promise<void> {
    const prisma = this.deps.prisma.getInstance();

    const contenuRapport: ContenuRapport = {
      coordinateur: rapport.coordinateur,
      sectionActiviteComptes: rapport.sectionActiviteComptes,
      sectionActiviteChantiersVA: rapport.sectionActiviteChantiersVA,
    };

    await prisma.rapport_hebdomadaire_coordinateur.upsert({
      where: { id: rapport.id },
      create: {
        id: rapport.id,
        coordinateur_id: rapport.coordinateur.id,
        date_debut_periode: rapport.periode.dateDebut,
        date_fin_periode: rapport.periode.dateFin,
        contenu_rapport: contenuRapport as unknown as Prisma.InputJsonValue,
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

    return rapports.map((row): RapportHebdomadaire => {
      const contenu = contenuRapportSchema.parse(row.contenu_rapport);

      return {
        id: row.id,
        coordinateur: {
          id: row.coordinateur_id,
          email: contenu.coordinateur.email,
          nom: contenu.coordinateur.nom,
          prenom: contenu.coordinateur.prenom,
          profil: contenu.coordinateur.profil as ProfilCoordinateur,
          territoires: contenu.coordinateur.territoires,
          chantiers: contenu.coordinateur.chantiers,
          perimetres: contenu.coordinateur.perimetres ?? [],
        },
        periode: {
          dateDebut: row.date_debut_periode,
          dateFin: row.date_fin_periode,
        },
        sectionActiviteComptes: contenu.sectionActiviteComptes,
        sectionActiviteChantiersVA: contenu.sectionActiviteChantiersVA,
        statutEnvoi: row.statut_envoi,
        dateCreation: row.date_creation,
        dateEnvoi: row.date_envoi ?? undefined,
        dateDerniereTentative: row.date_derniere_tentative ?? undefined,
        nombreTentatives: row.nombre_tentatives,
        erreurEnvoi: row.erreur_envoi ?? undefined,
      };
    });
  }
}
