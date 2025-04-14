import { randomUUID } from 'node:crypto';
import { BadRequestError } from '@/server/app/error-boundary/bad-request-error';

export class Nouveaute {
  private _id: string;

  private _contenu: string;

  private _dateCreation: Date;

  private _version: string;

  private _date: string;

  private constructor(id: string, contenu: string, dateCreation: Date, version: string, date: string) {
    this._id = id;
    this._contenu = contenu;
    this._dateCreation = dateCreation;
    this._version = version;
    this._date = date;
  }

  get id(): string {
    return this._id;
  }

  get contenu(): string {
    return this._contenu;
  }

  get dateCreation(): Date {
    return this._dateCreation;
  }

  get version(): string {
    return this._version;
  }

  get date(): string {
    return this._date;
  }

  static creerNouveaute({ id, contenu, dateCreation, version, date }: { id?: string, contenu: string, dateCreation?: Date, version: string, date: string }): Nouveaute {
    return new Nouveaute(id ?? randomUUID(), contenu, dateCreation ?? new Date(), version, date);
  }

  static verifyVersion(version: string): string {
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      throw new BadRequestError('La version doit être un nombre entier');
    }
    return version;
  }

  static sanitizeHtml(html: string): string {
    const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed'];
    let sanitizedHtml = html;
    
    for (const tag of dangerousTags) {
      const openTagRegex = new RegExp(`<${tag}[^>]*>`, 'gi');
      const closeTagRegex = new RegExp(`</${tag}>`, 'gi');
      
      if (openTagRegex.test(sanitizedHtml) || closeTagRegex.test(sanitizedHtml)) {
        throw new BadRequestError('Le contenu HTML contient des balises non autorisées (script, style, etc.)');
      }
    }
    
    return sanitizedHtml;
  }
}
