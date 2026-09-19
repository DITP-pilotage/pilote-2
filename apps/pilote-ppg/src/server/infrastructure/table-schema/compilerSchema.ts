import type {
  ChampCompile,
  SchemaCompile,
  TableSchemaBrut,
} from "@/server/infrastructure/table-schema/TableSchema.types";

/**
 * Table Schema veut qu'un motif décrive la valeur entière, comme le faisait
 * Validata. `RegExp.test` cherche une sous-chaîne : sans cet ancrage, un motif
 * dont l'alternation est de premier niveau — `|` a une précédence plus faible
 * que `^` et `$` — n'est ancré que sur sa première et sa dernière branche.
 */
function ancrer(motif: string): RegExp {
  return new RegExp(`^(?:${motif})$`);
}

export function compilerSchema(
  brut: TableSchemaBrut,
  entetes: string[],
): SchemaCompile {
  const entetesNormalisees = entetes.map((entete) =>
    entete.trim().toLowerCase(),
  );
  const indexDe = (nom: string) =>
    entetesNormalisees.indexOf(nom.toLowerCase());

  // Toutes les RegExp et tous les Set sont construits ici, une fois par
  // chargement de schéma, et non par cellule.
  const champs: ChampCompile[] = brut.fields.map((champ) => {
    const contraintes = champ.constraints ?? {};
    return {
      nom: champ.name,
      exemple: champ.example ?? null,
      estNombre: champ.type === "number",
      indexDeColonne: indexDe(champ.name),
      requis: contraintes.required === true,
      motif: contraintes.pattern ? ancrer(contraintes.pattern) : null,
      valeursAutorisees: contraintes.enum ? new Set(contraintes.enum) : null,
      minimum: contraintes.minimum ?? null,
      maximum: contraintes.maximum ?? null,
    };
  });

  const indexColonnesClePrimaire: number[] = [];
  const colonnesClePrimaireAbsentes: string[] = [];

  for (const nomColonne of brut.primaryKey) {
    const index = indexDe(nomColonne);
    if (index === -1) {
      colonnesClePrimaireAbsentes.push(nomColonne);
    } else {
      indexColonnesClePrimaire.push(index);
    }
  }

  return {
    nom: brut.name,
    champs,
    indexColonnesClePrimaire,
    colonnesClePrimaireAbsentes,
  };
}
