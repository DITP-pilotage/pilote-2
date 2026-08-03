import { $Enums, Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RapportResponsableDonneesRepository } from "@/server/chantiers/domain/ports/RapportResponsableDonneesRepository";
import { RapportResponsableDonnees } from "@/server/chantiers/domain/RapportResponsableDonnees";

const chantierRapportSchema = z.object({
  nom_chantier: z.string(),
  id_chantier: z.string(),
  indicateursNonMisAJour: z.array(
    z.object({ id: z.string(), nom: z.string(), mailles: z.array(z.string()) }),
  ),
  nombreIndicateursNonMisAJour: z.string(),
});

const contenuRapportSchema = z.object({
  chantiers: z.array(chantierRapportSchema),
});

export class PrismaRapportResponsableDonneesRepository implements RapportResponsableDonneesRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async sauvegarder(rapport: RapportResponsableDonnees): Promise<void> {
    await this.dependencies.prisma
      .getInstance()
      .rapport_responsable_donnees.upsert({
        where: { id: rapport.id },
        create: {
          id: rapport.id,
          email_responsable: rapport.emailResponsable,
          contenu_rapport:
            rapport.contenuRapport as unknown as Prisma.InputJsonValue,
          statut_envoi: rapport.statutEnvoi,
          date_creation: rapport.dateCreation,
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
  ): Promise<RapportResponsableDonnees[]> {
    const rapports = await this.dependencies.prisma
      .getInstance()
      .rapport_responsable_donnees.findMany({
        where: { statut_envoi: statut },
      });

    return rapports.map((rapport) => ({
      id: rapport.id,
      emailResponsable: rapport.email_responsable,
      contenuRapport: contenuRapportSchema.parse(rapport.contenu_rapport),
      statutEnvoi: rapport.statut_envoi,
      dateCreation: rapport.date_creation,
      dateEnvoi: rapport.date_envoi,
      dateDerniereTentative: rapport.date_derniere_tentative,
      nombreTentatives: rapport.nombre_tentatives,
      erreurEnvoi: rapport.erreur_envoi,
    }));
  }
}
