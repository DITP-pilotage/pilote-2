import { randomUUID } from 'node:crypto';
import {
  HistorisationModificationDisponible,
} from '@/server/infrastructure/accès_données/historisationModification/HistorisationModificationDisponible';

export class HistorisationModification<K extends keyof HistorisationModificationDisponible> {
  private readonly _id: string;

  private readonly _typeDeModification: 'creation' | 'modification' | 'suppression';

  private readonly _dateDeModification: string;

  private readonly _tableModifieId: K;

  private readonly _ancienneValeur: HistorisationModificationDisponible[K] | null;

  private readonly _nouvelleValeur: HistorisationModificationDisponible[K] | null;

  constructor({
    id,
    typeDeModification,
    dateDeModification,
    tableModifieId,
    ancienneValeur,
    nouvelleValeur,
  }: {
    id: string,
    typeDeModification: 'creation' | 'modification' | 'suppression',
    dateDeModification: string,
    tableModifieId: K,
    ancienneValeur: HistorisationModificationDisponible[K] | null,
    nouvelleValeur: HistorisationModificationDisponible[K] | null
  }) {
    this._id = id;
    this._typeDeModification = typeDeModification;
    this._dateDeModification = dateDeModification;
    this._tableModifieId = tableModifieId;
    this._ancienneValeur = ancienneValeur;
    this._nouvelleValeur = nouvelleValeur;
  }

  get id(): string {
    return this._id;
  }

  get typeDeModification(): 'creation' | 'modification' | 'suppression' {
    return this._typeDeModification;
  }

  get dateDeModification(): string {
    return this._dateDeModification;
  }

  get tableModifieId(): keyof HistorisationModificationDisponible {
    return this._tableModifieId;
  }

  get ancienneValeur(): object | null {
    return this._ancienneValeur;
  }

  get nouvelleValeur(): object | null {
    return this._nouvelleValeur;
  }

  static creerHistorisationModificationCreation<K extends keyof HistorisationModificationDisponible>({
    id,
    tableModifieId,
    nouvelleValeur,
  }: {
    id?: string,
    tableModifieId: K,
    nouvelleValeur: HistorisationModificationDisponible[K]
  }) {
    return new HistorisationModification({
      id: id || randomUUID(),
      typeDeModification: 'creation',
      dateDeModification: new Date().toISOString(),
      tableModifieId,
      ancienneValeur: null,
      nouvelleValeur,
    });
  }
}
