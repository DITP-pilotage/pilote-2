import { $Enums } from "@prisma/client";
import { SanitizerHTML } from "@/server/app/domain/SanitizerHTML";

export class ArticleCentreAide {
  private _id: string;

  private _titre: string;

  private _contenu: string | null;

  private _titreBrouillon: string | null;

  private _contenuBrouillon: string | null;

  private _titreAffiche: string | null;

  private _titreAfficheBrouillon: string | null;

  private _type: $Enums.TypeArticleCentreAide;

  private _ordre: number;

  private _parentId: string | null;

  private _estPublie: boolean;

  private _estMasque: boolean;

  private _dateCreation: Date;

  private _dateModification: Date;

  private constructor(
    id: string,
    titre: string,
    contenu: string | null,
    titreBrouillon: string | null,
    contenuBrouillon: string | null,
    titreAffiche: string | null,
    titreAfficheBrouillon: string | null,
    type: $Enums.TypeArticleCentreAide,
    ordre: number,
    parentId: string | null,
    estPublie: boolean,
    estMasque: boolean,
    dateCreation: Date,
    dateModification: Date,
  ) {
    this._id = id;
    this._titre = titre;
    this._contenu = contenu;
    this._titreBrouillon = titreBrouillon;
    this._contenuBrouillon = contenuBrouillon;
    this._titreAffiche = titreAffiche;
    this._titreAfficheBrouillon = titreAfficheBrouillon;
    this._type = type;
    this._ordre = ordre;
    this._parentId = parentId;
    this._estPublie = estPublie;
    this._estMasque = estMasque;
    this._dateCreation = dateCreation;
    this._dateModification = dateModification;
  }

  get id(): string {
    return this._id;
  }

  get titre(): string {
    return this._titre;
  }

  get contenu(): string | null {
    return this._contenu;
  }

  get titreBrouillon(): string | null {
    return this._titreBrouillon;
  }

  get contenuBrouillon(): string | null {
    return this._contenuBrouillon;
  }

  get titreAffiche(): string | null {
    return this._titreAffiche;
  }

  get titreAfficheBrouillon(): string | null {
    return this._titreAfficheBrouillon;
  }

  get type(): $Enums.TypeArticleCentreAide {
    return this._type;
  }

  get ordre(): number {
    return this._ordre;
  }

  get parentId(): string | null {
    return this._parentId;
  }

  get estPublie(): boolean {
    return this._estPublie;
  }

  get estMasque(): boolean {
    return this._estMasque;
  }

  get dateCreation(): Date {
    return this._dateCreation;
  }

  get dateModification(): Date {
    return this._dateModification;
  }

  publier(): ArticleCentreAide {
    return this.copier({
      titre: this._titreBrouillon ?? this._titre,
      contenu: this._contenuBrouillon,
      titreAffiche: this._titreAfficheBrouillon,
      estPublie: true,
    });
  }

  depublier(): ArticleCentreAide {
    return this.copier({ estPublie: false });
  }

  basculerVisibilite(): ArticleCentreAide {
    return this.copier({ estMasque: !this._estMasque });
  }

  private copier(
    changements: Partial<{
      titre: string;
      contenu: string | null;
      titreAffiche: string | null;
      estPublie: boolean;
      estMasque: boolean;
    }>,
  ): ArticleCentreAide {
    return ArticleCentreAide.creerArticle({
      id: this._id,
      titre: this._titre,
      contenu: this._contenu,
      titreBrouillon: this._titreBrouillon,
      contenuBrouillon: this._contenuBrouillon,
      titreAffiche: this._titreAffiche,
      titreAfficheBrouillon: this._titreAfficheBrouillon,
      type: this._type,
      ordre: this._ordre,
      parentId: this._parentId,
      estPublie: this._estPublie,
      estMasque: this._estMasque,
      dateCreation: this._dateCreation,
      ...changements,
    });
  }

  static creerArticle({
    id,
    titre,
    contenu,
    titreBrouillon,
    contenuBrouillon,
    titreAffiche,
    titreAfficheBrouillon,
    type,
    ordre,
    parentId,
    estPublie,
    estMasque,
    dateCreation,
    dateModification,
  }: {
    id: string;
    titre: string;
    contenu?: string | null;
    titreBrouillon?: string | null;
    contenuBrouillon?: string | null;
    titreAffiche?: string | null;
    titreAfficheBrouillon?: string | null;
    type: $Enums.TypeArticleCentreAide;
    ordre: number;
    parentId?: string | null;
    estPublie?: boolean;
    estMasque?: boolean;
    dateCreation?: Date;
    dateModification?: Date;
  }): ArticleCentreAide {
    return new ArticleCentreAide(
      id,
      titre,
      contenu ?? null,
      titreBrouillon ?? null,
      contenuBrouillon ?? null,
      titreAffiche ?? null,
      titreAfficheBrouillon ?? null,
      type,
      ordre,
      parentId ?? null,
      estPublie ?? false,
      estMasque ?? false,
      dateCreation ?? new Date(),
      dateModification ?? new Date(),
    );
  }

  static sanitizeHtml(html: string): string {
    return SanitizerHTML.sanitize(html);
  }
}
