import type {
  SchemaCompile,
  ViolationContrainte,
} from "@/server/infrastructure/table-schema/TableSchema.types";

/**
 * Catalogue des messages affichés à l'utilisateur.
 *
 * Ces textes existaient déjà dans l'adapter Validata, mais la table qui les
 * servait indexait sur des champs (`code`, `note`) que Validata v0.12 a cessé
 * de renvoyer : elle ne s'exécutait plus depuis PIL-553, et l'utilisateur
 * recevait les messages bruts du service tiers. Ici chaque violation est typée
 * à sa détection, donc le message est choisi directement.
 */
export function genererMessageErreur(
  violation: ViolationContrainte,
  schema: SchemaCompile,
  numeroDeLigne: number,
): string {
  const { type, nomDuChamp, cellule } = violation;

  if (type === "blank-row") {
    return `Toutes les cellules de la ligne ${numeroDeLigne} sont vides.`;
  }

  if (type === "primary-key") {
    return `La ligne ${numeroDeLigne} est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.`;
  }

  if (type === "missing-cell") {
    return `La colonne '${nomDuChamp}' est absente à la ligne ${numeroDeLigne}. Toutes les colonnes doivent être renseignées, même vides.`;
  }

  if (nomDuChamp === "identifiant_indic") {
    if (type === "required") {
      return `Un indicateur ne peut etre vide. C'est le cas à la ligne ${numeroDeLigne}.`;
    }
    if (type === "pattern") {
      return "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur.";
    }
  }

  if (nomDuChamp === "zone_id" && type === "pattern") {
    return `La zone '${cellule}' n'est pas une zone valide pour ce type de saisie (ligne ${numeroDeLigne}).`;
  }

  if (nomDuChamp === "date_valeur" && type === "pattern") {
    return `La date '${cellule}' n'est pas dans un format valide (AAAA-MM-JJ ou JJ/MM/AAAA), ligne ${numeroDeLigne}.`;
  }

  if (nomDuChamp === "type_valeur" && type === "enum") {
    return "Le type de valeur doit être vi (valeur initiale), va (valeur d'avancement) ou vc (valeur cible).";
  }

  if (nomDuChamp === "valeur") {
    if (type === "type") {
      return `La valeur '${cellule}' n'est pas un nombre valide (ligne ${numeroDeLigne}). Utilisez le point comme séparateur décimal.`;
    }
    const champ = schema.champs.find((candidat) => candidat.nom === "valeur");
    if (type === "minimum") {
      return `La valeur '${cellule}' doit être supérieure ou égale à ${champ?.minimum} (ligne ${numeroDeLigne}).`;
    }
    if (type === "maximum") {
      return `La valeur '${cellule}' doit être inférieure ou égale à ${champ?.maximum} (ligne ${numeroDeLigne}).`;
    }
  }

  if (type === "required") {
    return `La colonne '${nomDuChamp}' doit être renseignée. C'est le cas à la ligne ${numeroDeLigne}.`;
  }

  if (type === "enum") {
    const champ = schema.champs.find((candidat) => candidat.nom === nomDuChamp);
    const autorisees = [...(champ?.valeursAutorisees ?? [])].join(", ");
    return `La valeur '${cellule}' de la colonne '${nomDuChamp}' doit être l'une des valeurs suivantes : ${autorisees} (ligne ${numeroDeLigne}).`;
  }

  return `La valeur '${cellule}' de la colonne '${nomDuChamp}' n'est pas dans un format attendu (ligne ${numeroDeLigne}).`;
}
