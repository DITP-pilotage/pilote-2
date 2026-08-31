import { genererMessageErreur } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/genererMessageErreur";
import {
  TableSchema,
  ViolationContrainte,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types";

const SCHEMA: TableSchema = {
  fields: [
    {
      name: "identifiant_indic",
      type: "string",
      constraints: { required: true, pattern: "^IND-([0-9]{3,4})$" },
    },
    {
      name: "zone_id",
      type: "string",
      constraints: { required: true, pattern: "^(D[0-9]{2}|R[0-9]{2})$" },
    },
    {
      name: "date_valeur",
      type: "string",
      constraints: { required: true, pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
    },
    {
      name: "type_valeur",
      type: "string",
      constraints: { required: true, enum: ["vi", "va", "vc"] },
    },
    {
      name: "valeur",
      type: "number",
      constraints: { required: false, minimum: 0, maximum: 100 },
    },
  ],
  primaryKey: ["identifiant_indic", "zone_id", "date_valeur", "type_valeur"],
};

describe("genererMessageErreur", () => {
  it.each<[ViolationContrainte, string]>([
    [
      {
        type: "required",
        nomDuChamp: "identifiant_indic",
        cellule: "",
        ligneDeDonnees: 0,
      },
      "Un indicateur ne peut etre vide. C'est le cas à la ligne 2.",
    ],
    [
      {
        type: "pattern",
        nomDuChamp: "identifiant_indic",
        cellule: "ABC",
        ligneDeDonnees: 3,
      },
      "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur.",
    ],
    [
      {
        type: "pattern",
        nomDuChamp: "zone_id",
        cellule: "F001",
        ligneDeDonnees: 0,
      },
      "La zone renseignée 'F001' n'est pas une zone valide pour ce schéma d'import (ligne 2).",
    ],
    [
      {
        type: "pattern",
        nomDuChamp: "date_valeur",
        cellule: "31-12-2023",
        ligneDeDonnees: 0,
      },
      "La date '31-12-2023' n'est pas dans un format valide (AAAA-MM-JJ ou JJ/MM/AAAA), ligne 2.",
    ],
    [
      {
        type: "enum",
        nomDuChamp: "type_valeur",
        cellule: "xx",
        ligneDeDonnees: 0,
      },
      "Le type de valeur doit être vi (valeur initiale), va (valeur d'avancement) ou vc (valeur cible).",
    ],
    [
      { type: "type", nomDuChamp: "valeur", cellule: "abc", ligneDeDonnees: 0 },
      "La valeur 'abc' n'est pas un nombre valide (ligne 2).",
    ],
    [
      {
        type: "maximum",
        nomDuChamp: "valeur",
        cellule: "150",
        ligneDeDonnees: 0,
      },
      "La valeur '150' doit être inférieure ou égale à 100 (ligne 2).",
    ],
    [
      {
        type: "minimum",
        nomDuChamp: "valeur",
        cellule: "-5",
        ligneDeDonnees: 0,
      },
      "La valeur '-5' doit être supérieure ou égale à 0 (ligne 2).",
    ],
    [
      {
        type: "primaryKey-duplicate",
        nomDuChamp: "identifiant_indic, zone_id, date_valeur, type_valeur",
        cellule: "",
        ligneDeDonnees: 1,
      },
      "La ligne 3 est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.",
    ],
    [
      {
        type: "primaryKey-vide",
        nomDuChamp: "identifiant_indic, zone_id, date_valeur, type_valeur",
        cellule: "",
        ligneDeDonnees: 2,
      },
      "La ligne 4 est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.",
    ],
  ])(
    "pour la violation %o, doit générer le message attendu",
    (violation, messageAttendu) => {
      expect(genererMessageErreur(violation, SCHEMA)).toEqual(messageAttendu);
    },
  );
});
