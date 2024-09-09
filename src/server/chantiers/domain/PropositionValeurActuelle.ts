import { randomUUID } from 'node:crypto';

export class PropositionValeurActuelle {
  private readonly _id: string;

  private readonly _indicId: string;

  private readonly _valeurActuelleProposee: number;

  private readonly _territoireCode: string;

  private readonly _dateValeurActuelle: Date;

  private readonly _idAuteurModification: string;
  
  private readonly _auteurModification: string;

  private readonly _dateProposition: Date;

  private readonly _motifProposition: string;

  private readonly _sourceDonneeEtMethodeCalcul: string;

  private readonly _statut: string;

  private constructor({
    id,
    indicId,
    valeurActuelleProposee,
    territoireCode,
    dateValeurActuelle,
    idAuteurModification,
    auteurModification,
    dateProposition,
    motifProposition,
    sourceDonneeEtMethodeCalcul,
    statut,
  }: {
    id: string,
    indicId: string,
    valeurActuelleProposee: number,
    territoireCode: string,
    dateValeurActuelle: Date,
    idAuteurModification: string,
    auteurModification: string,
    dateProposition: Date,
    motifProposition: string,
    sourceDonneeEtMethodeCalcul: string,
    statut: string
  }) {
    this._id = id;
    this._indicId = indicId;
    this._valeurActuelleProposee = valeurActuelleProposee;
    this._territoireCode = territoireCode;
    this._dateValeurActuelle = dateValeurActuelle;
    this._idAuteurModification = idAuteurModification;
    this._auteurModification = auteurModification;
    this._dateProposition = dateProposition;
    this._motifProposition = motifProposition;
    this._sourceDonneeEtMethodeCalcul = sourceDonneeEtMethodeCalcul;
    this._statut = statut;
  }

  get id(): string {
    return this._id;
  }

  get indicId(): string {
    return this._indicId;
  }

  get valeurActuelleProposee(): number {
    return this._valeurActuelleProposee;
  }

  get territoireCode(): string {
    return this._territoireCode;
  }

  get dateValeurActuelle(): Date {
    return this._dateValeurActuelle;
  }

  get idAuteurModification(): string {
    return this._idAuteurModification;
  }

  get auteurModification(): string {
    return this._auteurModification;
  }

  get dateProposition(): Date {
    return this._dateProposition;
  }

  get motifProposition(): string {
    return this._motifProposition;
  }

  get sourceDonneeEtMethodeCalcul(): string {
    return this._sourceDonneeEtMethodeCalcul;
  }

  get statut(): string {
    return this._statut;
  }

  static creerPropositionValeurActuelle({
    id,
    indicId,
    valeurActuelleProposee,
    territoireCode,
    dateValeurActuelle,
    idAuteurModification,
    auteurModification,
    dateProposition,
    motifProposition,
    sourceDonneeEtMethodeCalcul,
    statut,
  }: {
    id?: string,
    indicId: string,
    valeurActuelleProposee: number,
    territoireCode: string,
    dateValeurActuelle: Date,
    idAuteurModification: string,
    auteurModification: string,
    dateProposition: Date,
    motifProposition: string,
    sourceDonneeEtMethodeCalcul: string,
    statut: string
  }) {
    return new PropositionValeurActuelle({
      id: id || randomUUID(),
      indicId,
      valeurActuelleProposee,
      territoireCode,
      dateValeurActuelle,
      idAuteurModification,
      auteurModification,
      dateProposition,
      motifProposition,
      sourceDonneeEtMethodeCalcul,
      statut,
    });
  }
}
