import { faker } from '@faker-js/faker/locale/fr';
import { Commentaires, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export default class CommentaireBuilder {
  private _risquesEtFreinsÀLever: Commentaires['risquesEtFreinsÀLever'];

  private _solutionsEtActionsÀVenir: Commentaires['solutionsEtActionsÀVenir'];

  private _exemplesConcretsDeRéussite: Commentaires['exemplesConcretsDeRéussite'];

  private _autresRésultatsObtenus: Commentaires['autresRésultatsObtenus'];

  constructor() {
    this._risquesEtFreinsÀLever = faker.helpers.arrayElement([null, this._générerUnCommentaire('risquesEtFreinsÀLever')]);
    this._solutionsEtActionsÀVenir = faker.helpers.arrayElement([null, this._générerUnCommentaire('solutionsEtActionsÀVenir')]);
    this._exemplesConcretsDeRéussite = faker.helpers.arrayElement([null, this._générerUnCommentaire('exemplesConcretsDeRéussite')]);
    this._autresRésultatsObtenus = faker.helpers.arrayElement([null, this._générerUnCommentaire('autresRésultatsObtenus')]);
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

  avecRisquesEtFreinsÀLever(risquesEtFreinsÀLever: Commentaires['risquesEtFreinsÀLever']): CommentaireBuilder {
    this._risquesEtFreinsÀLever = risquesEtFreinsÀLever;
    return this;
  }

  avecSolutionsEtActionsÀVenir(solutionsEtActionsÀVenir: Commentaires['solutionsEtActionsÀVenir']): CommentaireBuilder {
    this._solutionsEtActionsÀVenir = solutionsEtActionsÀVenir;
    return this;
  }

  avecExemplesConcretsDeRéussite(exemplesConcretsDeRéussite: Commentaires['exemplesConcretsDeRéussite']): CommentaireBuilder {
    this._exemplesConcretsDeRéussite = exemplesConcretsDeRéussite;
    return this;
  }

  avecAutresRésultatsObtenus(autresRésultatsObtenus: Commentaires['autresRésultatsObtenus']): CommentaireBuilder {
    this._autresRésultatsObtenus = autresRésultatsObtenus;
    return this;
  }

  build(): Commentaires {
    return {
      risquesEtFreinsÀLever: this._risquesEtFreinsÀLever,
      solutionsEtActionsÀVenir: this._solutionsEtActionsÀVenir,
      exemplesConcretsDeRéussite: this._exemplesConcretsDeRéussite,
      autresRésultatsObtenus: this._autresRésultatsObtenus,
    };
  }
}
