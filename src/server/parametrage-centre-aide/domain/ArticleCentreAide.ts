import { $Enums } from "@prisma/client";
import { SanitizerHTML } from "@/server/app/domain/SanitizerHTML";

export class ArticleCentreAide {
  private _id: string;

  private _titre: string;

  private _contenu: string | null;

  private _titreBrouillon: string | null;

  private _contenuBrouillon: string | null;

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

  static creerArticle({
    id,
    titre,
    contenu,
    titreBrouillon,
    contenuBrouillon,
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
