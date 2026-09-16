import type {
  SchemaCompile,
  ViolationContrainte,
} from "@/server/infrastructure/table-schema/TableSchema.types";

/**
 * Mesuré sur Validata : frictionless plafonne à 1000 erreurs et cesse alors de
 * lire les lignes (`rows_processed: 200` sur `rows: 2000`).
 */
export const PLAFOND_VIOLATIONS_DEFAUT = 1000;

/**
 * Mesuré sur Validata : `1e5`, `+5`, `-3` et ` 5 ` sont des nombres valides ;
 * `12,5` (virgule décimale) et `abc` produisent une erreur de type.
 */
const REGEX_NOMBRE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

const SEPARATEUR_CLE = "␟";

export function validerLignes(
  schema: SchemaCompile,
  lignes: string[][],
  plafond: number = PLAFOND_VIOLATIONS_DEFAUT,
): { violations: ViolationContrainte[]; tronque: boolean } {
  const violations: ViolationContrainte[] = [];
  const clesVues = new Set<string>();
  let tronque = false;

  // Les champs absents du fichier sont écartés une fois pour toutes, pas à
  // chaque ligne : c'est le comportement `schema_sync`.
  const champs = schema.champs.filter((champ) => champ.indexDeColonne !== -1);

  const ajouter = (violation: ViolationContrainte) => {
    if (violations.length >= plafond) {
      tronque = true;
      return;
    }
    violations.push(violation);
  };

  for (let indexDeLigne = 0; indexDeLigne < lignes.length; indexDeLigne += 1) {
    if (tronque) break;
    const ligne = lignes[indexDeLigne];

    const ligneEstVide = ligne.every(
      (cellule) => (cellule ?? "").trim() === "",
    );
    if (ligneEstVide) {
      // Une ligne vide produit deux violations distinctes chez Validata.
      ajouter({
        type: "blank-row",
        nomDuChamp: null,
        indexDeColonne: -1,
        cellule: null,
        indexDeLigne,
      });
      ajouter({
        type: "primary-key",
        nomDuChamp: null,
        indexDeColonne: -1,
        cellule: null,
        indexDeLigne,
      });
      continue;
    }

    for (const champ of champs) {
      const base = {
        nomDuChamp: champ.nom,
        indexDeColonne: champ.indexDeColonne,
        indexDeLigne,
      };

      // La ligne s'arrête avant cette colonne : Validata signale `missing-cell`,
      // y compris sur un champ non requis.
      if (champ.indexDeColonne >= ligne.length) {
        ajouter({ type: "missing-cell", cellule: "", ...base });
        continue;
      }

      const cellule = (ligne[champ.indexDeColonne] ?? "").trim();

      if (cellule === "") {
        if (champ.requis) ajouter({ type: "required", cellule, ...base });
        continue;
      }

      if (champ.motif && !champ.motif.test(cellule)) {
        ajouter({ type: "pattern", cellule, ...base });
        continue;
      }

      if (champ.valeursAutorisees && !champ.valeursAutorisees.has(cellule)) {
        ajouter({ type: "enum", cellule, ...base });
        continue;
      }

      if (champ.estNombre) {
        if (!REGEX_NOMBRE.test(cellule)) {
          ajouter({ type: "type", cellule, ...base });
          continue;
        }
        const nombre = Number(cellule);
        if (champ.minimum !== null && nombre < champ.minimum) {
          ajouter({ type: "minimum", cellule, ...base });
        }
        if (champ.maximum !== null && nombre > champ.maximum) {
          ajouter({ type: "maximum", cellule, ...base });
        }
      }
    }

    if (schema.indexColonnesClePrimaire.length > 0) {
      const cle = schema.indexColonnesClePrimaire
        .map((index) => (ligne[index] ?? "").trim())
        .join(SEPARATEUR_CLE);

      if (clesVues.has(cle)) {
        ajouter({
          type: "primary-key",
          nomDuChamp: null,
          indexDeColonne: -1,
          cellule: null,
          indexDeLigne,
        });
      } else {
        clesVues.add(cle);
      }
    }
  }

  return { violations, tronque };
}
