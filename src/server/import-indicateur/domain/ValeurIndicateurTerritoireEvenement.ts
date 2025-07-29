import { randomUUID } from "node:crypto";
import { TypeEvenement } from "@/server/import-indicateur/domain/TypeEvenement";
import { TypeValeur } from "@/server/import-indicateur/domain/TypeValeur";

export class ValeurIndicateurTerritoireEvenement {
  private readonly _id: string;

  private readonly _indicId: string;

  private readonly _territoireCode: string;

  private readonly _typeEvenement: TypeEvenement;

  private readonly _typeValeur: TypeValeur;

  private readonly _dateValeur: Date;

  private readonly _donneesComplementaires: Record<string, unknown>;

  private readonly _idAuteurModification: string;

  private readonly _correlationId: string;

  private constructor({
    id,
    indicId,
    territoireCode,
    typeEvenement,
    typeValeur,
    dateValeur,
    donneesComplementaires,
    idAuteurModification,
    correlationId,
  }: {
    id: string;
    indicId: string;
    territoireCode: string;
    typeEvenement: TypeEvenement;
    typeValeur: TypeValeur;
    dateValeur: Date;
    donneesComplementaires: Record<string, unknown>;
    idAuteurModification: string;
    correlationId: string;
  }) {
    this._id = id;
    this._indicId = indicId;
    this._territoireCode = territoireCode;
    this._typeEvenement = typeEvenement;
    this._typeValeur = typeValeur;
    this._dateValeur = dateValeur;
    this._donneesComplementaires = donneesComplementaires;
    this._idAuteurModification = idAuteurModification;
    this._correlationId = correlationId;
  }

  get id(): string {
    return this._id;
  }

  get indicId(): string {
    return this._indicId;
  }

  get territoireCode(): string {
    return this._territoireCode;
  }

  get typeEvenement(): TypeEvenement {
    return this._typeEvenement;
  }

  get typeValeur(): TypeValeur {
    return this._typeValeur;
  }

  get dateValeur(): Date {
    return this._dateValeur;
  }

  get donneesComplementaires(): Record<string, unknown> {
    return this._donneesComplementaires;
  }

  get idAuteurModification(): string {
    return this._idAuteurModification;
  }

  get correlationId(): string {
    return this._correlationId;
  }

  static createValeurIndicateurTerritoireEvenement({
    id = randomUUID(),
    indicId,
    territoireCode,
    typeEvenement,
    typeValeur,
    dateValeur,
    donneesComplementaires = {},
    idAuteurModification,
    correlationId,
  }: {
    id?: string;
    indicId: string;
    territoireCode: string;
    typeEvenement: TypeEvenement;
    typeValeur: TypeValeur;
    dateValeur: Date;
    donneesComplementaires?: Record<string, unknown>;
    idAuteurModification: string;
    correlationId: string;
  }) {
    return new ValeurIndicateurTerritoireEvenement({
      id,
      indicId,
      territoireCode,
      typeEvenement,
      typeValeur,
      dateValeur,
      donneesComplementaires,
      idAuteurModification,
      correlationId,
    });
  }
}
