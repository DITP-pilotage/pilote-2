import { PrismaClient, proposition_valeur_actuelle as PrismaPropositionValeurActuelle } from '@prisma/client';
import { PropositionValeurActuelle } from '@/server/chantiers/domain/PropositionValeurActuelle';
import {
  PropositionValeurActuelleRepository,
} from '@/server/chantiers/domain/ports/PropositionValeurActuelleRepository';
import { StatutProposition } from '@/server/chantiers/domain/StatutProposition';

const convertirEnModel = (propositionValeurActuelle: PropositionValeurActuelle): PrismaPropositionValeurActuelle => {
  return {
    id: propositionValeurActuelle.id,
    indic_id: propositionValeurActuelle.indicId,
    valeur_actuelle_proposee: propositionValeurActuelle.valeurActuelleProposee,
    territoire_code: propositionValeurActuelle.territoireCode,
    date_valeur_actuelle: propositionValeurActuelle.dateValeurActuelle,
    id_auteur_modification: propositionValeurActuelle.idAuteurModification,
    auteur_modification: propositionValeurActuelle.auteurModification,
    date_proposition: propositionValeurActuelle.dateProposition,
    motif_proposition: propositionValeurActuelle.motifProposition,
    source_donnee_methode_calcul: propositionValeurActuelle.sourceDonneeEtMethodeCalcul,
    statut: propositionValeurActuelle.statut,
  };
};

export class PrismaPropositionValeurActuelleRepository implements PropositionValeurActuelleRepository {
  constructor(private prismaClient: PrismaClient) {}

  async creerPropositionValeurActuelle(propositionValeurActuelle: PropositionValeurActuelle): Promise<void> {
    const prismaPropositionValeurActuelle = convertirEnModel(propositionValeurActuelle);
    await this.prismaClient.proposition_valeur_actuelle.create({
      data: prismaPropositionValeurActuelle,
    });
  }

  async supprimerPropositionValeurActuelle({
    indicId,
    territoireCode,
  }: {
    indicId: string,
    territoireCode: string,
  }): Promise<void> {
    await this.prismaClient.proposition_valeur_actuelle.updateMany({
      where: {
        indic_id: indicId,
        territoire_code: territoireCode,
      },
      data: {
        statut: StatutProposition.SUPPRIME,
      },
    });
  }


}
