import { proposition_valeur_actuelle as PrismaPropositionValeurAvancement } from "@prisma/client";
import { PropositionValeurAvancement } from "@/server/chantiers/domain/PropositionValeurAvancement";
import {
  PropositionValeurAvancementRepository,
  PropositionValeurAvancementRapport,
} from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";
import { StatutProposition } from "@/server/chantiers/domain/StatutProposition";
import { prisma } from "@/server/db/prisma";
import { formaterDate } from "@/client/utils/date/date";

const convertirEnModel = (
  propositionValeurAvancement: PropositionValeurAvancement,
): PrismaPropositionValeurAvancement => {
  return {
    id: propositionValeurAvancement.id,
    indic_id: propositionValeurAvancement.indicId,
    valeur_actuelle_proposee:
      propositionValeurAvancement.valeurAvancementProposee,
    territoire_code: propositionValeurAvancement.territoireCode,
    date_valeur_actuelle: propositionValeurAvancement.dateValeurAvancement,
    id_auteur_modification: propositionValeurAvancement.idAuteurModification,
    date_proposition: propositionValeurAvancement.dateProposition,
    motif_proposition: propositionValeurAvancement.motifProposition,
    source_donnee_methode_calcul:
      propositionValeurAvancement.sourceDonneeEtMethodeCalcul,
    statut: propositionValeurAvancement.statut,
    date_modification_statut: null,
  };
};

export class PrismaPropositionValeurAvancementRepository
  implements PropositionValeurAvancementRepository
{
  async creerPropositionValeurAvancement(
    propositionValeurAvancement: PropositionValeurAvancement,
  ): Promise<void> {
    const prismaPropositionValeurAvancement = convertirEnModel(
      propositionValeurAvancement,
    );
    await prisma.proposition_valeur_actuelle.create({
      data: prismaPropositionValeurAvancement,
    });
  }

  async supprimerPropositionValeurAvancement({
    indicId,
    territoireCode,
  }: {
    indicId: string;
    territoireCode: string;
  }): Promise<void> {
    await prisma.proposition_valeur_actuelle.updateMany({
      where: {
        indic_id: indicId,
        territoire_code: territoireCode,
        statut: StatutProposition.EN_COURS,
      },
      data: {
        statut: StatutProposition.RETIREE,
        date_modification_statut: new Date(),
      },
    });
  }

  async annulePropositionValeurAvancementPrecedente({
    indicId,
    territoireCode,
  }: {
    indicId: string;
    territoireCode: string;
  }): Promise<void> {
    await prisma.proposition_valeur_actuelle.updateMany({
      where: {
        indic_id: indicId,
        territoire_code: territoireCode,
        statut: StatutProposition.EN_COURS,
      },
      data: {
        statut: StatutProposition.ANNULEE,
        date_modification_statut: new Date(),
      },
    });
  }

  async recupererLaListeDesChantiersIdsAvecPropositionEnCours(): Promise<
    string[]
  > {
    const result = await prisma.indicateur_identite.findMany({
      where: {
        OR: [
          {
            maille_reg_agregee: false,
            indicateur_territoire: {
              some: {
                maille: "REG",
                proposition_valeur_actuelle: {
                  some: {
                    statut: "EN_COURS",
                  },
                },
              },
            },
          },
          {
            indicateur_territoire: {
              some: {
                maille: "DEPT",
                proposition_valeur_actuelle: {
                  some: {
                    statut: "EN_COURS",
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        chantier_id: true,
      },
      distinct: ["chantier_id"],
    });

    return result.map((r) => r.chantier_id);
  }

  async recupererLesPropositionsEnCoursParChantierIds() {
    const listePropositions = await prisma.proposition_valeur_actuelle.findMany(
      {
        where: {
          statut: "EN_COURS",
          indicateur_territoire: {
            OR: [
              {
                maille: "DEPT",
              },
              {
                maille: "REG",
                indicateur_identite: {
                  maille_reg_agregee: false,
                },
              },
            ],
          },
        },
        select: {
          indic_id: true,
          territoire_code: true,
          valeur_actuelle_proposee: true,
          date_valeur_actuelle: true,
          indicateur_territoire: {
            select: {
              valeur_actuelle_mandat: true,
              indicateur_identite: {
                select: {
                  id: true,
                  chantier_id: true,
                  nom: true,
                  unite_mesure: true,
                },
              },
              territoire: {
                select: {
                  nom: true,
                },
              },
            },
          },
        },
      },
    );

    return listePropositions.reduce((acc, p) => {
      const chantierId =
        p.indicateur_territoire.indicateur_identite.chantier_id;
      const indicateurId = p.indic_id;

      const rapport: PropositionValeurAvancementRapport = {
        indicateurId,
        territoireCode: p.territoire_code,
        valeurAvancementProposee: Number.isInteger(p.valeur_actuelle_proposee)
          ? p.valeur_actuelle_proposee.toString()
          : p.valeur_actuelle_proposee.toFixed(1).toString(),
        dateValeurAvancement: formaterDate(
          p.date_valeur_actuelle?.toISOString(),
          "DD/MM/YYYY",
        )!,
        valeurAvancementReference: Number.isInteger(
          p.indicateur_territoire.valeur_actuelle_mandat,
        )
          ? (p.indicateur_territoire.valeur_actuelle_mandat?.toString() ?? "")
          : (p.indicateur_territoire.valeur_actuelle_mandat
              ?.toFixed(1)
              .toString() ?? ""),
        nomIndicateur: p.indicateur_territoire.indicateur_identite.nom,
        uniteIndicateur:
          p.indicateur_territoire.indicateur_identite.unite_mesure ?? "",
        nomTerritoire: p.indicateur_territoire.territoire.nom,
      };

      if (!acc.has(chantierId)) {
        acc.set(chantierId, new Map());
      }

      const indicateurMap = acc.get(chantierId)!;

      if (!indicateurMap.has(indicateurId)) {
        indicateurMap.set(indicateurId, []);
      }

      indicateurMap.get(indicateurId)!.push(rapport);

      return acc;
    }, new Map<string, Map<string, PropositionValeurAvancementRapport[]>>());
  }
}
