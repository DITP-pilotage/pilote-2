import { $Enums } from "@prisma/client";
import { SanitizerHTML } from "@/server/app/domain/SanitizerHTML";

export class ArticleCentreAide {
  private _id: string;

  private _titre: string;

  private _contenu: string | null;

  private _type: $Enums.TypeArticleCentreAide;

  private _ordre: number;

  private _parentId: string | null;

  private _dateCreation: Date;

  private _dateModification: Date;

  private constructor(
    id: string,
    titre: string,
    contenu: string | null,
    type: $Enums.TypeArticleCentreAide,
    ordre: number,
    parentId: string | null,
    dateCreation: Date,
    dateModification: Date,
  ) {
    this._id = id;
    this._titre = titre;
    this._contenu = contenu;
    this._type = type;
    this._ordre = ordre;
    this._parentId = parentId;
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

  get type(): $Enums.TypeArticleCentreAide {
    return this._type;
  }

  get ordre(): number {
    return this._ordre;
  }

  get parentId(): string | null {
    return this._parentId;
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
    type,
    ordre,
    parentId,
    dateCreation,
    dateModification,
  }: {
    id: string;
    titre: string;
    contenu?: string | null;
    type: $Enums.TypeArticleCentreAide;
    ordre: number;
    parentId?: string | null;
    dateCreation?: Date;
    dateModification?: Date;
  }): ArticleCentreAide {
    return new ArticleCentreAide(
      id,
      titre,
      contenu ?? null,
      type,
      ordre,
      parentId ?? null,
      dateCreation ?? new Date(),
      dateModification ?? new Date(),
    );
  }

  static sanitizeHtml(html: string): string {
    return SanitizerHTML.sanitize(html);
  }
}
