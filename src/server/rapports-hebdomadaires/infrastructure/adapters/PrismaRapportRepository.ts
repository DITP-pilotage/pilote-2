import { $Enums, Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RapportRepository } from "@/server/rapports-hebdomadaires/domain/ports/RapportRepository";
import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";
import { ProfilCoordinateur } from "@/server/rapports-hebdomadaires/domain/Coordinateur";
import { CompteActivite } from "@/server/rapports-hebdomadaires/domain/CompteActivite";

const contenuRapportSchema = z.object({
  coordinateur: z.object({
    email: z.string(),
    nom: z.string(),
    prenom: z.string(),
    profil: z.enum(["COORDINATEUR_REGION", "COORDINATEUR_DEPARTEMENT"]),
    territoires: z.array(
      z.object({
        code: z.string(),
        nom: z.string(),
        maille: z.enum(["REG", "DEPT"]),
      }),
    ),
  }),
  sectionActiviteComptes: z.object({
    comptesCrees: z.array(
      z.object({
        email: z.string(),
        nom: z.string(),
        prenom: z.string(),
        profil: z.string(),
        territoires: z.array(z.object({ code: z.string(), nom: z.string() })),
      }),
    ),
    comptesDesactives: z.array(
      z.object({
        email: z.string(),
        nom: z.string(),
        prenom: z.string(),
        profil: z.string(),
        territoires: z.array(z.object({ code: z.string(), nom: z.string() })),
      }),
    ),
  }),
});

type ContenuRapport = z.infer<typeof contenuRapportSchema>;

export class PrismaRapportRepository implements RapportRepository {
  constructor(
    private readonly deps: {
      prisma: PrismaPilote;
    },
  ) {}

  async sauvegarder(rapport: RapportHebdomadaire): Promise<void> {
    const prisma = this.deps.prisma.getInstance();

    const contenuRapport: ContenuRapport = {
      coordinateur: {
        email: rapport.coordinateur.email,
        nom: rapport.coordinateur.nom,
        prenom: rapport.coordinateur.prenom,
        profil: rapport.coordinateur.profil,
        territoires: rapport.coordinateur.territoires,
      },
      sectionActiviteComptes: rapport.sectionActiviteComptes,
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
        },
        periode: {
          dateDebut: row.date_debut_periode,
          dateFin: row.date_fin_periode,
        },
        sectionActiviteComptes: contenu.sectionActiviteComptes,
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
