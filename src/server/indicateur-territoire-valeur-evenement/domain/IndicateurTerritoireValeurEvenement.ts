import { randomUUID } from "node:crypto";
import { TypeEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";
import { TypeValeur } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeValeur";

export class IndicateurTerritoireValeurEvenement {
  private readonly _id: string;

  private readonly _indicId: string;

  private readonly _territoireCode: string;

  private readonly _typeEvenement: TypeEvenement;

  private readonly _typeValeur: TypeValeur;

  private readonly _dateValeur: Date;

  private readonly _valeur: number;

  private readonly _donneesComplementaires: Record<string, unknown>;

  private readonly _idAuteurModification: string;

  private readonly _correlationId: string;

  private readonly _ordre: number;

  private constructor({
    id,
    indicId,
    territoireCode,
    typeEvenement,
    typeValeur,
    dateValeur,
    valeur,
    donneesComplementaires,
    idAuteurModification,
    correlationId,
    ordre,
  }: {
    id: string;
    indicId: string;
    territoireCode: string;
    typeEvenement: TypeEvenement;
    typeValeur: TypeValeur;
    dateValeur: Date;
    valeur: number;
    donneesComplementaires: Record<string, unknown>;
    idAuteurModification: string;
    correlationId: string;
    ordre: number;
  }) {
    this._id = id;
    this._indicId = indicId;
    this._territoireCode = territoireCode;
    this._typeEvenement = typeEvenement;
    this._typeValeur = typeValeur;
    this._dateValeur = dateValeur;
    this._valeur = valeur;
    this._donneesComplementaires = donneesComplementaires;
    this._idAuteurModification = idAuteurModification;
    this._correlationId = correlationId;
    this._ordre = ordre;
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

  get valeur(): number {
    return this._valeur;
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

  get ordre(): number {
    return this._ordre;
  }

  static createValeurIndicateurTerritoireEvenement({
    id = randomUUID(),
    indicId,
    territoireCode,
    typeEvenement,
    typeValeur,
    dateValeur,
    valeur,
    donneesComplementaires = {},
    idAuteurModification,
    correlationId,
    ordre,
  }: {
    id?: string;
    indicId: string;
    territoireCode: string;
    typeEvenement: TypeEvenement;
    typeValeur: TypeValeur;
    dateValeur: Date;
    valeur: number;
    donneesComplementaires?: Record<string, unknown>;
    idAuteurModification: string;
    correlationId: string;
    ordre: number;
  }) {
    return new IndicateurTerritoireValeurEvenement({
      id,
      indicId,
      territoireCode,
      typeEvenement,
      typeValeur,
      dateValeur,
      valeur,
      donneesComplementaires,
      idAuteurModification,
      correlationId,
      ordre,
    });
  }

  static prochainOrdre(valeurs: IndicateurTerritoireValeurEvenement[]) {
    return valeurs.length > 0
      ? Math.max(...valeurs.map((e) => e.ordre)) + 1
      : 1;
  }
}
