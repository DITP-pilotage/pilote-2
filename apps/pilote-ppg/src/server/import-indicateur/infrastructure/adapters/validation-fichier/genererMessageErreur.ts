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
 * Un code de territoire porte sa maille dans son préfixe, et le motif du schéma
 * dit quelles mailles il accepte : on le teste sur un échantillon par maille
 * plutôt que d'analyser la description en français du schéma.
 */
const ECHANTILLONS_DE_MAILLE = [
  { maille: "départementale", echantillon: "D46" },
  { maille: "régionale", echantillon: "R84" },
  { maille: "nationale", echantillon: "FRANCE" },
] as const;

function mailleDuCode(zone: string): string | null {
  if (/^FRANCE$/i.test(zone)) return "nationale";
  if (/^R/i.test(zone)) return "régionale";
  if (/^D/i.test(zone)) return "départementale";
  return null;
}

function maillesAcceptees(motif: RegExp | null): string[] {
  if (!motif) return [];
  return ECHANTILLONS_DE_MAILLE.filter(({ echantillon }) =>
    motif.test(echantillon),
  ).map(({ maille }) => maille);
}

function enumerer(elements: string[]): string {
  if (elements.length <= 1) return elements.join("");
  return `${elements.slice(0, -1).join(", ")} ou ${elements.at(-1)}`;
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

  const champDuSchema = schema.champs.find(
    (candidat) => candidat.nom === nomDuChamp,
  );
  // Les schémas portent un exemple par colonne : on le cite plutôt que de
  // décrire le format avec un gabarit, qu'un utilisateur peut recopier tel quel.
  const commeParExemple = champDuSchema?.exemple
    ? ` Exemple attendu : ${champDuSchema.exemple}.`
    : "";

  if (type === "blank-row") {
    return `Toutes les cellules de la ligne ${numeroDeLigne} sont vides.`;
  }

  if (type === "primary-key") {
    return `La ligne ${numeroDeLigne} est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.`;
  }

  if (type === "missing-cell") {
    return `La colonne '${nomDuChamp}' est absente à la ligne ${numeroDeLigne}. Toutes les colonnes doivent être présentes, même vides.`;
  }

  if (nomDuChamp === "identifiant_indic") {
    if (type === "required") {
      return `Un indicateur ne peut être vide. C'est le cas à la ligne ${numeroDeLigne}.`;
    }
    if (type === "pattern") {
      return `'${cellule}' n'est pas un identifiant d'indicateur valide (ligne ${numeroDeLigne}) : il doit être composé de 'IND-' suivi de 3 ou 4 chiffres.${commeParExemple} Vous pouvez vous référer au guide des indicateurs pour trouver celui de votre indicateur.`;
    }
  }

  if (nomDuChamp === "zone_id" && type === "pattern") {
    const mailleFournie = mailleDuCode(cellule ?? "");
    const acceptees = maillesAcceptees(champDuSchema?.motif ?? null);

    // Une zone de la mauvaise maille et une zone inconnue du référentiel sont
    // deux erreurs distinctes : la première se corrige en changeant d'échelle,
    // la seconde en corrigeant le code.
    if (
      mailleFournie &&
      acceptees.length > 0 &&
      !acceptees.includes(mailleFournie)
    ) {
      return `La zone '${cellule}' est une zone ${mailleFournie}, or cet indicateur ne peut être renseigné qu'à la maille ${enumerer(acceptees)} (ligne ${numeroDeLigne}).${commeParExemple}`;
    }

    return `La zone '${cellule}' n'est pas dans le référentiel des territoires (ligne ${numeroDeLigne}).${commeParExemple}`;
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
    if (type === "minimum") {
      return `La valeur '${cellule}' doit être supérieure ou égale à ${champDuSchema?.minimum} (ligne ${numeroDeLigne}).`;
    }
    if (type === "maximum") {
      return `La valeur '${cellule}' doit être inférieure ou égale à ${champDuSchema?.maximum} (ligne ${numeroDeLigne}).`;
    }
  }

  if (type === "required") {
    return `La colonne '${nomDuChamp}' doit être renseignée. C'est le cas à la ligne ${numeroDeLigne}.`;
  }

  if (type === "enum") {
    const autorisees = [...(champDuSchema?.valeursAutorisees ?? [])].join(", ");
    return `La valeur '${cellule}' de la colonne '${nomDuChamp}' doit être l'une des valeurs suivantes : ${autorisees} (ligne ${numeroDeLigne}).`;
  }

  return `La valeur '${cellule}' de la colonne '${nomDuChamp}' n'est pas dans un format attendu (ligne ${numeroDeLigne}).`;
}
