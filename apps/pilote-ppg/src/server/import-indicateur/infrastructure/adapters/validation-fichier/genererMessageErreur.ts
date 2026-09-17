import type {
  SchemaCompile,
  TypeViolation,
  ViolationContrainte,
} from "@/server/infrastructure/table-schema/TableSchema.types";

/**
 * Le rapport d'erreurs est lu par des agents, pas par des développeurs : le
 * type interne de la violation ne doit jamais atteindre l'écran.
 */
const LIBELLES: Record<TypeViolation, string> = {
  required: "Cellule obligatoire vide",
  pattern: "Format incorrect",
  enum: "Valeur non autorisée",
  type: "Valeur non numérique",
  minimum: "Valeur trop petite",
  maximum: "Valeur trop grande",
  "primary-key": "Ligne en double",
  "blank-row": "Ligne vide",
  "missing-cell": "Colonne manquante",
};

export function libelleTypeErreur(type: TypeViolation): string {
  return LIBELLES[type];
}

/**
 * Catalogue des messages affichés à l'utilisateur.
 *
 * Chaque violation étant typée à sa détection, le message est choisi
 * directement, sans couche de traduction intermédiaire susceptible de se
 * désynchroniser des règles.
 */
export function genererMessageErreur(
  violation: ViolationContrainte,
  schema: SchemaCompile,
  numeroDeLigne: number,
): string {
  const { type, nomDuChamp, cellule } = violation;

  // Les schémas portent un exemple par colonne : on le cite plutôt que de
  // décrire le format avec un gabarit, qu'un utilisateur peut recopier tel quel.
  const exemple = schema.champs.find(
    (candidat) => candidat.nom === nomDuChamp,
  )?.exemple;
  const commeParExemple = exemple ? ` Exemple attendu : ${exemple}.` : "";

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
      return `'${cellule}' n'est pas un identifiant d'indicateur valide (ligne ${numeroDeLigne}) : il doit être composé de 'IND-' suivi de 3 ou 4 chiffres.${commeParExemple} Vous pouvez vous référer au guide des indicateurs pour trouver celui du vôtre.`;
    }
  }

  if (nomDuChamp === "zone_id" && type === "pattern") {
    return `La zone '${cellule}' n'est pas une zone valide pour ce type de saisie (ligne ${numeroDeLigne}).${commeParExemple}`;
  }

  if (nomDuChamp === "date_valeur" && type === "pattern") {
    return `La date '${cellule}' n'est pas dans un format valide (AAAA-MM-JJ ou JJ/MM/AAAA), ligne ${numeroDeLigne}.${commeParExemple}`;
  }

  if (nomDuChamp === "type_valeur" && type === "enum") {
    return "Le type de valeur doit être vi (valeur initiale), va (valeur d'avancement) ou vc (valeur cible).";
  }

  if (nomDuChamp === "valeur") {
    if (type === "type") {
      return `La valeur '${cellule}' n'est pas un nombre valide (ligne ${numeroDeLigne}). Utilisez le point comme séparateur décimal.${commeParExemple}`;
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
