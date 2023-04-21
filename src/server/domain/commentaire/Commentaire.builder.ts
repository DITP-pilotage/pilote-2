import { faker } from '@faker-js/faker/locale/fr';
import { Commentaires, CommentairesMailleNationale, CommentairesMailleRégionaleOuDépartementale, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export default class CommentaireBuilder {
  private _commentaireSurLesDonnées: CommentairesMailleRégionaleOuDépartementale['commentairesSurLesDonnées'];

  private _autresRésultatsObtenus: CommentairesMailleRégionaleOuDépartementale['autresRésultatsObtenus'];

  private _autresRésultatsObtenusNonCorrélésAuxIndicateurs: CommentairesMailleNationale['autresRésultatsObtenusNonCorrélésAuxIndicateurs'];

  private _risquesEtFreinsÀLever: CommentairesMailleNationale['risquesEtFreinsÀLever'];

  private _solutionsEtActionsÀVenir: CommentairesMailleNationale['solutionsEtActionsÀVenir'];

  private _exemplesConcretsDeRéussite: CommentairesMailleNationale['exemplesConcretsDeRéussite'];

  constructor() {
    this._commentaireSurLesDonnées = faker.helpers.arrayElement([null, this._générerUnCommentaire('commentairesSurLesDonnées')]);
    this._autresRésultatsObtenus = faker.helpers.arrayElement([null, this._générerUnCommentaire('autresRésultatsObtenus')]);
    this._autresRésultatsObtenusNonCorrélésAuxIndicateurs = faker.helpers.arrayElement([null, this._générerUnCommentaire('autresRésultatsObtenusNonCorrélésAuxIndicateurs')]);
    this._risquesEtFreinsÀLever = faker.helpers.arrayElement([null, this._générerUnCommentaire('risquesEtFreinsÀLever')]);
    this._solutionsEtActionsÀVenir = faker.helpers.arrayElement([null, this._générerUnCommentaire('solutionsEtActionsÀVenir')]);
    this._exemplesConcretsDeRéussite = faker.helpers.arrayElement([null, this._générerUnCommentaire('exemplesConcretsDeRéussite')]);
  }

  private _générerUnCommentaire(type: TypeCommentaire) {
    return {
      id: faker.datatype.uuid(),
      type: type,
      contenu: faker.lorem.paragraph(),
      date: faker.date.recent(10, '2023-02-01T00:00:00.000Z').toISOString(),
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
