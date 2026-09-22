import { Table } from "@tanstack/react-table";

/**
 * Les composants de présentation partagés sont branchés sur une douzaine de tables
 * aux jeux de features différents. En v9 le type `Table` est paramétré par ses features,
 * qu'on ne peut donc pas figer ici sans interdire la moitié des appelants.
 *
 * On garde le typage des lignes et on laisse les features ouvertes — c'était déjà le
 * niveau de garantie de la v8, qui ne typait pas les features du tout. La solution
 * propre est `createTableHook()`, qui mérite son propre chantier.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LigneTableau = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TableauDe<T extends LigneTableau> = Table<any, T>;
