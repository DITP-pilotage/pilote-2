import { PrismaClient } from '@prisma/client';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import CommentaireProjetStructurantRepository from '@/server/domain/projetStructurant/commentaire/CommentaireRepository.interface';
import CommentaireProjetStructurant, { TypeCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import { groupByAndTransform } from '@/client/utils/arrays';

type CommentaireProjetStructurantPrisma = {
  id: string;
  projet_structurant_id: string;
  type: string;
  contenu: string;
  date: Date;
  auteur: string | null;
};

export const NOMS_TYPES_COMMENTAIRES: Record<string, TypeCommentaireProjetStructurant> = {
  dernieres_realisation_et_suivi_des_decisions: 'dernieresRealisationEtSuiviDesDecisions',
  difficultes_rencontrees_et_risques_anticipes: 'difficultésRencontréesEtRisquesAnticipés',
  solutions_proposees_et_prochaines_etapes: 'solutionsProposéesEtProchainesÉtapes',
  partenariats_et_moyens_mobilises: 'partenariatsEtMoyensMobilisés',
}; 

export const CODES_TYPES_COMMENTAIRES: Record<TypeCommentaireProjetStructurant, string> = {
  dernieresRealisationEtSuiviDesDecisions: 'dernieres_realisation_et_suivi_des_decisions',
  difficultésRencontréesEtRisquesAnticipés: 'difficultes_rencontrees_et_risques_anticipes',
  solutionsProposéesEtProchainesÉtapes: 'solutions_proposees_et_prochaines_etapes',
  partenariatsEtMoyensMobilisés: 'partenariats_et_moyens_mobilises',
};


export default class CommentaireProjetStructurantSQLRepository implements CommentaireProjetStructurantRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(commentaire: CommentaireProjetStructurantPrisma | null): CommentaireProjetStructurant {
    if (commentaire === null) return null;
    return {
      id: commentaire.id,
      type: NOMS_TYPES_COMMENTAIRES[commentaire.type],
      contenu: commentaire.contenu,
      date: commentaire.date.toISOString(),
      auteur: commentaire.auteur ?? '',
    };
  }

  async récupérerLePlusRécent(projetStructurantId: ProjetStructurant['id'], type: TypeCommentaireProjetStructurant): Promise<CommentaireProjetStructurant> {
    const commentaireLePlusRécent = await this.prisma.commentaire_projet_structurant.findFirst({
      where: {
        projet_structurant_id: projetStructurantId,
        type: CODES_TYPES_COMMENTAIRES[type],
      },
      orderBy: { date: 'desc' },
    });

    return this.mapperVersDomaine(commentaireLePlusRécent);
  }

  async récupérerLesPlusRécentsGroupésParProjetsStructurants(projetStructurantIds: ProjetStructurant['id'][]): Promise<Record<ProjetStructurant['id'], CommentaireProjetStructurant[]>> {
    const commentaires = await this.prisma.$queryRaw<CommentaireProjetStructurantPrisma[]>`
      SELECT c.projet_structurant_id, c.contenu, c.auteur, c.type, id, date
      FROM commentaire c
        INNER JOIN (
          SELECT type, projet_structurant_id, maille, code_insee, MAX(date) as maxdate
          FROM commentaire
          WHERE projet_structurant_id =  ANY (${projetStructurantIds})
          GROUP BY type, projet_structurant_id
        ) c_recents
          ON c.type = c_recents.type
          AND c.date = c_recents.maxdate
          AND c.projet_structurant_id = c_recents.projet_structurant_id
    `;

    return groupByAndTransform(
      commentaires,
      c => c.projet_structurant_id,
      (c: CommentaireProjetStructurantPrisma) => this.mapperVersDomaine(c),
    );
  }
}
