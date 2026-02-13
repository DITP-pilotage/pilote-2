import { $Enums, Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RapportPropositionsAvancementRepository } from "@/server/chantiers/domain/ports/RapportPropositionsAvancementRepository";
import {
  RapportPropositionsAvancement,
  ChantierRapport,
} from "@/server/chantiers/domain/RapportPropositionsAvancement";

const contenuRapportSchema = z.object({
  chantiers: z.custom<ChantierRapport[]>(),
  conseillerEmail: z.string(),
  texteIntro: z.string(),
});

export class PrismaRapportPropositionsAvancementRepository
  implements RapportPropositionsAvancementRepository
{
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async sauvegarder(rapport: RapportPropositionsAvancement): Promise<void> {
    await this.dependencies.prisma
      .getInstance()
      .rapport_propositions_avancement.upsert({
        where: { id: rapport.id },
        create: {
          id: rapport.id,
          utilisateur_id: rapport.utilisateur.id,
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
  ): Promise<RapportPropositionsAvancement[]> {
    const rapports = await this.dependencies.prisma
      .getInstance()
      .rapport_propositions_avancement.findMany({
        where: { statut_envoi: statut },
        include: { utilisateur: true },
      });

    return rapports.map((rapport) => ({
      id: rapport.id,
      utilisateur: {
        id: rapport.utilisateur.id,
        email: rapport.utilisateur.email,
      },
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
