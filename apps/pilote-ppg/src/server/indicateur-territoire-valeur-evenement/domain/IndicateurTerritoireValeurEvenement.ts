import { randomUUID } from "node:crypto";
import { TypeEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";
import { TypeValeur } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeValeur";

type DonneesComplementairesMap = {
  VALEUR_CREEE: undefined;
  VALEUR_MODIFIEE: undefined;
  VALEUR_HISTORISEE: undefined;
  PROPOSITION_VALEUR_CREEE: {
    motif: string;
    sourceDonneeEtMethodeCalcul: string;
  };
  PROPOSITION_VALEUR_MODIFIEE: {
    motif: string;
    sourceDonneeEtMethodeCalcul: string;
  };
  PROPOSITION_VALEUR_SUPPRIMEE: { motif: string };
  PROPOSITION_VALEUR_REFUSEE: { motif: string };
  PROPOSITION_VALEUR_ACCUSEE_RECEPTION: { motif: string };
  PROPOSITION_VALEUR_ACCEPTEE: { motif: string };
  PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE: undefined;
  PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE: undefined;
  PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION: { motif: string };
};

type ValeurEvenementMap = {
  VALEUR_CREEE: number;
  VALEUR_MODIFIEE: number | null;
  VALEUR_HISTORISEE: number | null;
  PROPOSITION_VALEUR_CREEE: number;
  PROPOSITION_VALEUR_MODIFIEE: number;
  PROPOSITION_VALEUR_SUPPRIMEE: number;
  PROPOSITION_VALEUR_REFUSEE: number;
  PROPOSITION_VALEUR_ACCUSEE_RECEPTION: number;
  PROPOSITION_VALEUR_ACCEPTEE: number;
  PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE: number | null;
  PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE: number | null;
  PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION: number;
};

export type DonneesComplementaires<T extends TypeEvenement> =
  DonneesComplementairesMap[T];

export type ValeurEvenement<T extends TypeEvenement> = ValeurEvenementMap[T];

export class IndicateurTerritoireValeurEvenement<
  T extends TypeEvenement = TypeEvenement,
> {
  private readonly _id: string;

  private readonly _indicId: string;

  private readonly _territoireCode: string;

  private readonly _typeEvenement: T;

  private readonly _typeValeur: TypeValeur;

  private readonly _dateValeur: Date;

  private readonly _valeur: ValeurEvenement<T>;

  private readonly _donneesComplementaires: DonneesComplementaires<T>;

  private readonly _idAuteurModification: string;

  private readonly _correlationId: string;

  private readonly _ordre: number;

  private readonly _dateCreation: Date;

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
    dateCreation,
  }: {
    id: string;
    indicId: string;
    territoireCode: string;
    typeEvenement: T;
    typeValeur: TypeValeur;
    dateValeur: Date;
    valeur: ValeurEvenement<T>;
    donneesComplementaires: DonneesComplementaires<T>;
    idAuteurModification: string;
    correlationId: string;
    ordre: number;
    dateCreation: Date;
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
    this._dateCreation = dateCreation;
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

  get typeEvenement(): T {
    return this._typeEvenement;
  }

  get typeValeur(): TypeValeur {
    return this._typeValeur;
  }

  get dateValeur(): Date {
    return this._dateValeur;
  }

  get valeur(): ValeurEvenement<T> {
    return this._valeur;
  }

  get donneesComplementaires(): DonneesComplementaires<T> {
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

  get dateCreation(): Date {
    return this._dateCreation;
  }

  static createValeurIndicateurTerritoireEvenement<T extends TypeEvenement>({
    id = randomUUID(),
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
    dateCreation,
  }: {
    id?: string;
    indicId: string;
    territoireCode: string;
    typeEvenement: T;
    typeValeur: TypeValeur;
    dateValeur: Date;
    valeur: ValeurEvenement<T>;
    donneesComplementaires: DonneesComplementaires<T>;
    idAuteurModification: string;
    correlationId: string;
    ordre: number;
    dateCreation: Date;
  }) {
    return new IndicateurTerritoireValeurEvenement<T>({
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
      dateCreation,
    });
  }

  static prochainOrdre(valeurs: IndicateurTerritoireValeurEvenement[]) {
    return valeurs.length > 0
      ? Math.max(...valeurs.map((e) => e.ordre)) + 1
      : 1;
  }
}
