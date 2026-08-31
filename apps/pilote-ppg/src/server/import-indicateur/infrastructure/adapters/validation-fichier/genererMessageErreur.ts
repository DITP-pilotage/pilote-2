import {
  TableSchema,
  ViolationContrainte,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types";

export function genererMessageErreur(
  violation: ViolationContrainte,
  schema: TableSchema,
): string {
  const ligne = violation.ligneDeDonnees + 2;

  if (
    violation.type === "primaryKey-duplicate" ||
    violation.type === "primaryKey-vide"
  ) {
    return `La ligne ${ligne} est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.`;
  }

  if (violation.nomDuChamp === "identifiant_indic") {
    if (violation.type === "required") {
      return `Un indicateur ne peut etre vide. C'est le cas à la ligne ${ligne}.`;
    }
    if (violation.type === "pattern") {
      return "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur.";
    }
  }

  if (violation.nomDuChamp === "zone_id" && violation.type === "pattern") {
    return `La zone renseignée '${violation.cellule}' n'est pas une zone valide pour ce schéma d'import (ligne ${ligne}).`;
  }

  if (violation.nomDuChamp === "date_valeur" && violation.type === "pattern") {
    return `La date '${violation.cellule}' n'est pas dans un format valide (AAAA-MM-JJ ou JJ/MM/AAAA), ligne ${ligne}.`;
  }

  if (violation.nomDuChamp === "type_valeur" && violation.type === "enum") {
    return "Le type de valeur doit être vi (valeur initiale), va (valeur d'avancement) ou vc (valeur cible).";
  }

  if (violation.nomDuChamp === "valeur" && violation.type === "type") {
    return `La valeur '${violation.cellule}' n'est pas un nombre valide (ligne ${ligne}).`;
  }

  if (
    violation.nomDuChamp === "valeur" &&
    (violation.type === "minimum" || violation.type === "maximum")
  ) {
    const champSchema = schema.fields.find((champ) => champ.name === "valeur");
    const borne =
      violation.type === "minimum"
        ? champSchema?.constraints?.minimum
        : champSchema?.constraints?.maximum;
    const comparateur =
      violation.type === "minimum"
        ? "supérieure ou égale à"
        : "inférieure ou égale à";
    return `La valeur '${violation.cellule}' doit être ${comparateur} ${borne} (ligne ${ligne}).`;
  }

  if (violation.type === "required") {
    return `Le champ '${violation.nomDuChamp}' est obligatoire. C'est le cas à la ligne ${ligne}.`;
  }

  if (violation.type === "enum") {
    const champSchema = schema.fields.find(
      (champ) => champ.name === violation.nomDuChamp,
    );
    const valeursAutorisees = champSchema?.constraints?.enum?.join(", ") ?? "";
    return `La valeur '${violation.cellule}' de la colonne '${violation.nomDuChamp}' doit être l'une des valeurs autorisées : ${valeursAutorisees} (ligne ${ligne}).`;
  }

  return `La valeur '${violation.cellule}' de la colonne '${violation.nomDuChamp}' n'est pas dans un format valide (ligne ${ligne}).`;
}
