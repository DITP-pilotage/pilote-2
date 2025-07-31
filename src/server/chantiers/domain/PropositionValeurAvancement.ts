import { randomUUID } from "node:crypto";
import { StatutPropositionType } from "./StatutProposition";

export class PropositionValeurAvancement {
  private readonly _id: string;

  private readonly _indicId: string;

  private readonly _valeurAvancementProposee: number;

  private readonly _territoireCode: string;

  private readonly _dateValeurAvancement: Date;

  private readonly _idAuteurModification: string;

  private readonly _auteurModification: string;

  private readonly _dateProposition: Date;

  private readonly _motifProposition: string;

  private readonly _sourceDonneeEtMethodeCalcul: string;

  private readonly _statut: StatutPropositionType;

  private constructor({
    id,
    indicId,
    valeurAvancementProposee,
    territoireCode,
    dateValeurAvancement,
    idAuteurModification,
    auteurModification,
    dateProposition,
    motifProposition,
    sourceDonneeEtMethodeCalcul,
    statut,
  }: {
    id: string;
    indicId: string;
    valeurAvancementProposee: number;
    territoireCode: string;
    dateValeurAvancement: Date;
    idAuteurModification: string;
    auteurModification: string;
    dateProposition: Date;
    motifProposition: string;
    sourceDonneeEtMethodeCalcul: string;
    statut: StatutPropositionType;
  }) {
    this._id = id;
    this._indicId = indicId;
    this._valeurAvancementProposee = valeurAvancementProposee;
    this._territoireCode = territoireCode;
    this._dateValeurAvancement = dateValeurAvancement;
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

  get valeurAvancementProposee(): number {
    return this._valeurAvancementProposee;
  }

  get territoireCode(): string {
    return this._territoireCode;
  }

  get dateValeurAvancement(): Date {
    return this._dateValeurAvancement;
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

  get statut(): StatutPropositionType {
    return this._statut;
  }

  static creerPropositionValeurAvancement({
    id,
    indicId,
    valeurAvancementProposee,
    territoireCode,
    dateValeurAvancement,
    idAuteurModification,
    auteurModification,
    dateProposition,
    motifProposition,
    sourceDonneeEtMethodeCalcul,
    statut,
  }: {
    id?: string;
    indicId: string;
    valeurAvancementProposee: number;
    territoireCode: string;
    dateValeurAvancement: Date;
    idAuteurModification: string;
    auteurModification: string;
    dateProposition: Date;
    motifProposition: string;
    sourceDonneeEtMethodeCalcul: string;
    statut: StatutPropositionType;
  }) {
    return new PropositionValeurAvancement({
      id: id || randomUUID(),
      indicId,
      valeurAvancementProposee,
      territoireCode,
      dateValeurAvancement,
      idAuteurModification,
      auteurModification,
      dateProposition,
      motifProposition,
      sourceDonneeEtMethodeCalcul,
      statut,
    });
  }
}
