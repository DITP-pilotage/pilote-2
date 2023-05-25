import { faker } from '@faker-js/faker/locale/fr';
import { Commentaires, CommentairesMailleNationale, CommentairesMailleRégionaleOuDépartementale, TypeCommentaireChantier } from '@/server/domain/commentaire/Commentaire.interface';
import { générerPeutÊtreNull } from '@/server/infrastructure/test/builders/utils';

export default class CommentaireBuilder {
  private _commentaireSurLesDonnées: CommentairesMailleRégionaleOuDépartementale['commentairesSurLesDonnées'];

  private _autresRésultatsObtenus: CommentairesMailleRégionaleOuDépartementale['autresRésultatsObtenus'];

  private _autresRésultatsObtenusNonCorrélésAuxIndicateurs: CommentairesMailleNationale['autresRésultatsObtenusNonCorrélésAuxIndicateurs'];

  private _risquesEtFreinsÀLever: CommentairesMailleNationale['risquesEtFreinsÀLever'];

  private _solutionsEtActionsÀVenir: CommentairesMailleNationale['solutionsEtActionsÀVenir'];

  private _exemplesConcretsDeRéussite: CommentairesMailleNationale['exemplesConcretsDeRéussite'];

  constructor() {
    this._commentaireSurLesDonnées = générerPeutÊtreNull(0.1, this._générerUnCommentaire('commentairesSurLesDonnées'));
    this._autresRésultatsObtenus = générerPeutÊtreNull(0.1, this._générerUnCommentaire('autresRésultatsObtenus'));
    this._autresRésultatsObtenusNonCorrélésAuxIndicateurs = générerPeutÊtreNull(0.5, this._générerUnCommentaire('autresRésultatsObtenusNonCorrélésAuxIndicateurs'));
    this._risquesEtFreinsÀLever = générerPeutÊtreNull(0.1, this._générerUnCommentaire('risquesEtFreinsÀLever'));
    this._solutionsEtActionsÀVenir = générerPeutÊtreNull(0.1, this._générerUnCommentaire('solutionsEtActionsÀVenir'));
    this._exemplesConcretsDeRéussite = générerPeutÊtreNull(0.1, this._générerUnCommentaire('exemplesConcretsDeRéussite'));
  }

  private _générerUnCommentaire(type: TypeCommentaireChantier) {
    return {
      id: faker.datatype.uuid(),
      type: type,
      contenu: faker.lorem.paragraph(),
      date: faker.date.recent(60, '2023-05-01T00:00:00.000Z').toISOString(),
      auteur: faker.helpers.arrayElement(['', faker.name.fullName()]),
    };
  }

  avecRisquesEtFreinsÀLever(risquesEtFreinsÀLever: CommentairesMailleNationale['risquesEtFreinsÀLever']): CommentaireBuilder {
    this._risquesEtFreinsÀLever = risquesEtFreinsÀLever;
    return this;
  }

  avecSolutionsEtActionsÀVenir(solutionsEtActionsÀVenir: CommentairesMailleNationale['solutionsEtActionsÀVenir']): CommentaireBuilder {
    this._solutionsEtActionsÀVenir = solutionsEtActionsÀVenir;
    return this;
  }

  avecExemplesConcretsDeRéussite(exemplesConcretsDeRéussite: CommentairesMailleNationale['exemplesConcretsDeRéussite']): CommentaireBuilder {
    this._exemplesConcretsDeRéussite = exemplesConcretsDeRéussite;
    return this;
  }

  avecAutresRésultatsObtenusNonCorrélésAuxIndicateurs(autresRésultatsObtenusNonCorrélésAuxIndicateurs: CommentairesMailleNationale['autresRésultatsObtenusNonCorrélésAuxIndicateurs']): CommentaireBuilder {
    this._autresRésultatsObtenusNonCorrélésAuxIndicateurs = autresRésultatsObtenusNonCorrélésAuxIndicateurs;
    return this;
  }

  avecAutresRésultatsObtenus(autresRésultatsObtenus: CommentairesMailleRégionaleOuDépartementale['autresRésultatsObtenus']): CommentaireBuilder {
    this._autresRésultatsObtenus = autresRésultatsObtenus;
    return this;
  }

  avecCommentairesSurLesDonnées(commentairesSurLesDonnées: CommentairesMailleRégionaleOuDépartementale['commentairesSurLesDonnées']): CommentaireBuilder {
    this._commentaireSurLesDonnées = commentairesSurLesDonnées;
    return this;
  }

  build(): Commentaires {
    return {
      commentairesSurLesDonnées: this._commentaireSurLesDonnées,
      autresRésultatsObtenus: this._autresRésultatsObtenus,
      autresRésultatsObtenusNonCorrélésAuxIndicateurs: this._autresRésultatsObtenusNonCorrélésAuxIndicateurs,
      risquesEtFreinsÀLever: this._risquesEtFreinsÀLever,
      solutionsEtActionsÀVenir: this._solutionsEtActionsÀVenir,
      exemplesConcretsDeRéussite: this._exemplesConcretsDeRéussite,
    };
  }
}
