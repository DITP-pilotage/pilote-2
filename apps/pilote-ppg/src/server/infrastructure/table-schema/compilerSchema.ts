import type {
  ChampCompile,
  SchemaCompile,
  TableSchemaBrut,
} from "@/server/infrastructure/table-schema/TableSchema.types";

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
      estNombre: champ.type === "number",
      indexDeColonne: indexDe(champ.name),
      requis: contraintes.required === true,
      motif: contraintes.pattern ? new RegExp(contraintes.pattern) : null,
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
