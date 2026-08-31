import {
  TableSchema,
  ViolationContrainte,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types";

const REGEX_NOMBRE = /^-?\d+(\.\d+)?$/;

export function validerContraintesDeChamp(
  schema: TableSchema,
  entetes: string[],
  lignesDeDonnees: string[][],
): ViolationContrainte[] {
  const violations: ViolationContrainte[] = [];

  schema.fields.forEach((champ) => {
    const indexColonne = entetes.indexOf(champ.name);

    lignesDeDonnees.forEach((ligne, ligneDeDonnees) => {
      const cellule = (ligne[indexColonne] ?? "").trim();
      const estVide = cellule === "";

      if (champ.constraints?.required && estVide) {
        violations.push({
          type: "required",
          nomDuChamp: champ.name,
          cellule,
          ligneDeDonnees,
        });
        return;
      }

      if (estVide) {
        return;
      }

      if (
        champ.constraints?.pattern &&
        !new RegExp(champ.constraints.pattern).test(cellule)
      ) {
        violations.push({
          type: "pattern",
          nomDuChamp: champ.name,
          cellule,
          ligneDeDonnees,
        });
      }

      if (
        champ.constraints?.enum &&
        !champ.constraints.enum.includes(cellule)
      ) {
        violations.push({
          type: "enum",
          nomDuChamp: champ.name,
          cellule,
          ligneDeDonnees,
        });
      }

      if (champ.type === "number") {
        if (!REGEX_NOMBRE.test(cellule)) {
          violations.push({
            type: "type",
            nomDuChamp: champ.name,
            cellule,
            ligneDeDonnees,
          });
          return;
        }
        const valeurNumerique = Number(cellule);
        if (
          champ.constraints?.minimum !== undefined &&
          valeurNumerique < champ.constraints.minimum
        ) {
          violations.push({
            type: "minimum",
            nomDuChamp: champ.name,
            cellule,
            ligneDeDonnees,
          });
        }
        if (
          champ.constraints?.maximum !== undefined &&
          valeurNumerique > champ.constraints.maximum
        ) {
          violations.push({
            type: "maximum",
            nomDuChamp: champ.name,
            cellule,
            ligneDeDonnees,
          });
        }
      }
    });
  });

  return violations;
}

export function detecterViolationsClePrimaire(
  schema: TableSchema,
  entetes: string[],
  lignesDeDonnees: string[][],
): ViolationContrainte[] {
  const violations: ViolationContrainte[] = [];
  const indexColonnesCle = schema.primaryKey.map((nomChamp) =>
    entetes.indexOf(nomChamp),
  );
  const nomDuChamp = schema.primaryKey.join(", ");
  const clesVues = new Set<string>();

  lignesDeDonnees.forEach((ligne, ligneDeDonnees) => {
    const valeursCle = indexColonnesCle.map((index) =>
      (ligne[index] ?? "").trim(),
    );
    const cleEstVide = valeursCle.every((valeur) => valeur === "");
    const cle = valeursCle.join("␟");

    if (cleEstVide || clesVues.has(cle)) {
      violations.push({
        type: cleEstVide ? "primaryKey-vide" : "primaryKey-duplicate",
        nomDuChamp,
        cellule: "",
        ligneDeDonnees,
      });
      return;
    }

    clesVues.add(cle);
  });

  return violations;
}
