import { proposition_valeur_actuelle as PrismaPropositionValeurActuelle } from '@prisma/client';
import { PropositionValeurActuelle } from '@/server/chantiers/domain/PropositionValeurActuelle';
import {
  PropositionValeurActuelleRepository,
  PropositionValeurAvancementRapport,
} from '@/server/chantiers/domain/ports/PropositionValeurActuelleRepository';
import { StatutProposition } from '@/server/chantiers/domain/StatutProposition';
import { prisma } from '@/server/db/prisma';
import { formaterDate } from '@/client/utils/date/date';

const convertirEnModel = (propositionValeurActuelle: PropositionValeurActuelle): PrismaPropositionValeurActuelle => {
  return {
    id: propositionValeurActuelle.id,
    indic_id: propositionValeurActuelle.indicId,
    valeur_actuelle_proposee: propositionValeurActuelle.valeurActuelleProposee,
    territoire_code: propositionValeurActuelle.territoireCode,
    date_valeur_actuelle: propositionValeurActuelle.dateValeurActuelle,
    id_auteur_modification: propositionValeurActuelle.idAuteurModification,
    date_proposition: propositionValeurActuelle.dateProposition,
    motif_proposition: propositionValeurActuelle.motifProposition,
    source_donnee_methode_calcul: propositionValeurActuelle.sourceDonneeEtMethodeCalcul,
    statut: propositionValeurActuelle.statut,
    date_modification_statut: null,
  };
};

export class PrismaPropositionValeurActuelleRepository implements PropositionValeurActuelleRepository {
  async creerPropositionValeurActuelle(propositionValeurActuelle: PropositionValeurActuelle): Promise<void> {
    const prismaPropositionValeurActuelle = convertirEnModel(propositionValeurActuelle);
    await prisma.proposition_valeur_actuelle.create({
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

  async annulePropositionValeurActuellePrecedente({
    indicId,
    territoireCode,
  }: {
    indicId: string,
    territoireCode: string,
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

  async recupererLaListeDesChantiersIdsAvecPropositionEnCours(): Promise<string[]> {
    const result = await prisma.indicateur_identite.findMany({
      where: {
        indicateur_territoire: {
          some: {
            proposition_valeur_actuelle: {
              some: {
                statut: 'EN_COURS',
              },
            },
          },
        },
      },
      select: {
        chantier_id: true,
      },
      distinct: ['chantier_id'],
    });
  
    return result.map(r => r.chantier_id);
  }  

  async recupererLesPropositionsEnCoursParChantierIds() {
    const listePropositions = await prisma.proposition_valeur_actuelle.findMany({
      where: {
        statut: 'EN_COURS',
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
    });
  
    return listePropositions.reduce((acc, p) => {
      const chantierId = p.indicateur_territoire.indicateur_identite.chantier_id;
      const indicateurId = p.indic_id;
  
      const rapport: PropositionValeurAvancementRapport = {
        indicateurId,
        territoireCode: p.territoire_code,
        valeurAvancementProposee: p.valeur_actuelle_proposee.toString(),
        dateValeurAvancement: formaterDate(p.date_valeur_actuelle?.toISOString(), 'DD/MM/YYYY')!,
        valeurAvancementReference: p.indicateur_territoire.valeur_actuelle_mandat?.toString() ?? '',
        nomIndicateur: p.indicateur_territoire.indicateur_identite.nom,
        uniteIndicateur: p.indicateur_territoire.indicateur_identite.unite_mesure ?? '',
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
