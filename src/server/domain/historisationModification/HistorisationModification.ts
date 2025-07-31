import { randomUUID } from "node:crypto";
import {
  HistorisationModificationDisponible,
  tableConversionModification,
  tableRecuperationId,
} from "@/server/infrastructure/accès_données/historisationModification/HistorisationModificationDisponible";

export class HistorisationModification<
  K extends keyof HistorisationModificationDisponible,
> {
  private readonly _id: string;

  private readonly _idObjetModifie: string;

  private readonly _typeDeModification:
    | "creation"
    | "modification"
    | "suppression";

  private readonly _dateDeModification: string;

  private readonly _tableModifieId: K;

  private readonly _ancienneValeur: Partial<
    HistorisationModificationDisponible[K]
  > | null;

  private readonly _nouvelleValeur: Partial<
    HistorisationModificationDisponible[K]
  > | null;

  private readonly _auteur_id: string;

  private constructor({
    id,
    auteurId,
    idObjetModifie,
    typeDeModification,
    dateDeModification,
    tableModifieId,
    ancienneValeur,
    nouvelleValeur,
  }: {
    id: string;
    auteurId: string;
    idObjetModifie: string;
    typeDeModification: "creation" | "modification" | "suppression";
    dateDeModification: string;
    tableModifieId: K;
    ancienneValeur: Partial<HistorisationModificationDisponible[K]> | null;
    nouvelleValeur: Partial<HistorisationModificationDisponible[K]> | null;
  }) {
    this._id = id;
    this._auteur_id = auteurId;
    this._idObjetModifie = idObjetModifie;
    this._typeDeModification = typeDeModification;
    this._dateDeModification = dateDeModification;
    this._tableModifieId = tableModifieId;
    this._ancienneValeur = ancienneValeur;
    this._nouvelleValeur = nouvelleValeur;
  }

  get id(): string {
    return this._id;
  }

  get typeDeModification(): "creation" | "modification" | "suppression" {
    return this._typeDeModification;
  }

  get dateDeModification(): string {
    return this._dateDeModification;
  }

  get tableModifieId(): keyof HistorisationModificationDisponible {
    return this._tableModifieId;
  }

  get ancienneValeur(): Partial<HistorisationModificationDisponible[K]> | null {
    return this._ancienneValeur;
  }

  get nouvelleValeur(): Partial<HistorisationModificationDisponible[K]> | null {
    return this._nouvelleValeur;
  }

  get auteurId(): string {
    return this._auteur_id;
  }

  get idObjetModifie(): string {
    return this._idObjetModifie;
  }

  static creerHistorisationCreation<
    K extends keyof HistorisationModificationDisponible,
  >({
    id,
    auteurId,
    tableModifieId,
    nouvelleValeur,
  }: {
    id?: string;
    auteurId: string;
    tableModifieId: K;
    nouvelleValeur: HistorisationModificationDisponible[K];
  }) {
    return new HistorisationModification({
      id: id || randomUUID(),
      idObjetModifie: tableRecuperationId[tableModifieId](nouvelleValeur),
      auteurId,
      typeDeModification: "creation",
      dateDeModification: new Date().toISOString(),
      tableModifieId,
      ancienneValeur: null,
      nouvelleValeur,
    });
  }

  static creerHistorisationModification<
    K extends keyof HistorisationModificationDisponible,
  >({
    id,
    auteurId,
    tableModifieId,
    nouvelleValeur,
    ancienneValeur,
  }: {
    id?: string;
    auteurId: string;
    tableModifieId: K;
    ancienneValeur: HistorisationModificationDisponible[K];
    nouvelleValeur: HistorisationModificationDisponible[K];
  }) {
    const [diffAncienneValeur, diffNouvelleValeur] = Object.keys(
      ancienneValeur,
    ).reduce(
      (acc, valeur) => {
        const key = (
          valeur[0] === "_" ? valeur.slice(1) : valeur
        ) as keyof HistorisationModificationDisponible[K];
        if (ancienneValeur[key] !== nouvelleValeur[key]) {
          acc[0][key] = ancienneValeur[key];
          acc[1][key] = nouvelleValeur[key];
        }
        return acc;
      },
      [{}, {}] as [
        Partial<HistorisationModificationDisponible[K]>,
        Partial<HistorisationModificationDisponible[K]>,
      ],
    );

    return new HistorisationModification({
      id: id || randomUUID(),
      idObjetModifie: tableRecuperationId[tableModifieId](ancienneValeur),
      typeDeModification: "modification",
      dateDeModification: new Date().toISOString(),
      auteurId,
      tableModifieId,
      ancienneValeur:
        diffAncienneValeur &&
        tableConversionModification[tableModifieId](diffAncienneValeur),
      nouvelleValeur:
        diffNouvelleValeur &&
        tableConversionModification[tableModifieId](diffNouvelleValeur),
    });
  }
}
