import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RapportPropositionsAvancementRepository } from "@/server/chantiers/domain/ports/RapportPropositionsAvancementRepository";
import {
  RapportPropositionsAvancement,
  ContenuRapport,
} from "@/server/chantiers/domain/RapportPropositionsAvancement";

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
          utilisateur_id: rapport.utilisateurId,
          contenu_rapport: rapport.contenuRapport,
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
      });

    return rapports.map((rapport) => ({
      id: rapport.id,
      utilisateurId: rapport.utilisateur_id,
      contenuRapport: rapport.contenu_rapport as ContenuRapport,
      statutEnvoi: rapport.statut_envoi,
      dateCreation: rapport.date_creation,
      dateEnvoi: rapport.date_envoi,
      dateDerniereTentative: rapport.date_derniere_tentative,
      nombreTentatives: rapport.nombre_tentatives,
      erreurEnvoi: rapport.erreur_envoi,
    }));
  }

  async recupererEmailUtilisateur(utilisateurId: string): Promise<string> {
    const utilisateur = await this.dependencies.prisma
      .getInstance()
      .utilisateur.findUniqueOrThrow({
        where: { id: utilisateurId },
        select: { email: true },
      });

    return utilisateur.email;
  }
}
