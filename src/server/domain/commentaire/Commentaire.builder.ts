import { faker } from '@faker-js/faker/locale/fr';
import { Commentaire, TypeCommentaireChantier } from '@/server/domain/commentaire/Commentaire.interface';
import { générerPeutÊtreNull } from '@/server/infrastructure/test/builders/utils';

export default class CommentaireBuilder {
  private _commentaireSurLesDonnées: Commentaire;

  private _autresRésultatsObtenus: Commentaire;

  private _autresRésultatsObtenusNonCorrélésAuxIndicateurs: Commentaire;

  private _risquesEtFreinsÀLever: Commentaire;

  private _solutionsEtActionsÀVenir: Commentaire;

  private _exemplesConcretsDeRéussite: Commentaire;

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

  build(): Commentaire[] {
    return [
      this._commentaireSurLesDonnées,
      this._autresRésultatsObtenus,
      this._autresRésultatsObtenusNonCorrélésAuxIndicateurs,
      this._risquesEtFreinsÀLever,
      this._solutionsEtActionsÀVenir,
      this._exemplesConcretsDeRéussite,
    ];
  }
}

