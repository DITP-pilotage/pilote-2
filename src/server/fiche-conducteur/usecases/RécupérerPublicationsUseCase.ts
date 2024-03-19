import { ObjectifRepository } from '@/server/fiche-conducteur/domain/ports/ObjectifRepository';
import { ObjectifType } from '@/server/fiche-conducteur/domain/ObjectifType';
import { DecisionStrategiqueRepository } from '@/server/fiche-conducteur/domain/ports/DecisionStrategiqueRepository';
import { DecisionStrategiqueType } from '@/server/fiche-conducteur/domain/DecisionStrategiqueType';
import { CommentaireType } from '@/server/fiche-conducteur/domain/CommentaireType';
import { CommentaireRepository } from '@/server/fiche-conducteur/domain/ports/CommentaireRepository';

interface Dependencies {
  objectifRepository: ObjectifRepository
  decisionStrategiqueRepository: DecisionStrategiqueRepository
  commentaireRepository: CommentaireRepository
}

export class RécupérerPublicationsUseCase {
  private objectifRepository: ObjectifRepository;

  private decisionStrategiqueRepository: DecisionStrategiqueRepository;

  private commentaireRepository: CommentaireRepository;

  constructor({ objectifRepository, decisionStrategiqueRepository, commentaireRepository }: Dependencies) {
    this.objectifRepository = objectifRepository;
    this.decisionStrategiqueRepository = decisionStrategiqueRepository;
    this.commentaireRepository = commentaireRepository;
  }

  async run({ chantierId }: { chantierId: string }): Promise<Map<ObjectifType | DecisionStrategiqueType | CommentaireType, string>> {
    const listeObjectifs = await this.objectifRepository.listerObjectifParChantierId({ chantierId })
      .then(listeObjectifsResult => listeObjectifsResult.sort((objectif1, objectif2) => objectif1.date.localeCompare(objectif2.date)));

    const listeDecisionsStrategique = await this.decisionStrategiqueRepository.listerDecisionStrategiqueParChantierId({ chantierId })
      .then((listeDecisionsStrategiqueResult => listeDecisionsStrategiqueResult.sort((decisionStrategique1, decisionStrategique2) => decisionStrategique1.date.localeCompare(decisionStrategique2.date))));

    const listeCommentaires = await this.commentaireRepository.listerCommentaireParChantierId({ chantierId })
      .then((listeCommentairesResult => listeCommentairesResult.sort((commentaire1, commentaire2) => commentaire1.date.localeCompare(commentaire2.date))));

    return [...listeObjectifs, ...listeDecisionsStrategique, ...listeCommentaires].reduce((acc, val) => {
      acc.set(val.type, val.contenu);
      return acc;
    }, new Map<ObjectifType | DecisionStrategiqueType | CommentaireType, string>());
  }
}
