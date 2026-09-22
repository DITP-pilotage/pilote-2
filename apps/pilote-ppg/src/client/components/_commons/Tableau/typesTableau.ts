import type { Renderable, SortDirection } from "@tanstack/react-table";

/**
 * En v9 le type `Table` est paramétré par son jeu de features, et deux jeux différents
 * donnent deux types incompatibles — même à une seule clé près, y compris un simple slot
 * de modèle de lignes (mesuré). Un composant de présentation partagé entre des écrans aux
 * features différentes ne peut donc pas typer sa prop sur `Table`.
 *
 * Trois échappatoires ont été essayées et écartées, mesure à l'appui :
 *  - `Table<any, T>` : `ExtractFeatureMapTypes` traite `any` par `UnionToIntersection`,
 *    donc ce type exige l'intersection des seize features. Aucune table concrète ne passe.
 *    `StockFeatures` et `TableFeatures` échouent pareil.
 *  - paramétrer le composant sur `TFeatures` : tant que le générique n'est pas résolu,
 *    `ExtractFeatureMapTypes` rend une union que TypeScript ne réduit pas, et `getIsSorted`
 *    n'existe sur aucune branche.
 *  - un jeu concret minimal en espérant qu'un sur-ensemble passe : il ne passe pas, la
 *    comparaison structurelle abandonne sur `Column.parent`, qui est auto-référentiel.
 *
 * Ce qui reste, et qui est d'ailleurs plus honnête : décrire ce que ces composants
 * consomment RÉELLEMENT. `flexRender` étant générique sur ses props, rien n'oblige à
 * passer par les types du cœur. Le contrat ci-dessous est donc à la fois plus étroit et
 * plus explicite qu'un `Table` complet — il dit exactement de quoi l'affichage dépend.
 *
 * La réponse amont pour aller plus loin est `createTableHook()`, qui unifierait le jeu de
 * features à l'échelle de l'app. C'est un chantier à part.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LigneTableau = Record<string, any>;

/**
 * Les contrats ci-dessous sont génériques sur le CONTEXTE de rendu, pas sur les features :
 * un seul paramètre, que TypeScript résout sans difficulté, là où le feature map produit
 * une union irréductible. C'est aussi ce qui permet à `flexRender` d'unifier le gabarit de
 * colonne et le contexte qu'on lui passe.
 */

/** Une colonne, vue par l'en-tête partagé. */
export type ColonneAffichable<TContexte extends object> = {
  getIsSorted: () => false | SortDirection;
  getCanSort: () => boolean;
  clearSorting: () => void;
  toggleSorting: (desc?: boolean) => void;
  columnDef: {
    header?: Renderable<TContexte>;
    id?: string;
    meta?: { width?: string } | undefined;
  };
};

/** Un en-tête de colonne, vu par l'en-tête partagé. */
export type EnTeteAffichable<TContexte extends object> = {
  id: string;
  column: ColonneAffichable<TContexte>;
  getContext: () => TContexte;
};

/** Ce dont l'en-tête partagé a besoin, et rien de plus. */
export type TableauAvecEnTetes<TContexte extends object> = {
  getHeaderGroups: () => Array<{
    id: string;
    headers: EnTeteAffichable<TContexte>[];
  }>;
};

/** Une cellule, vue par le contenu partagé. */
export type CelluleAffichable<TContexte extends object> = {
  id: string;
  column: { columnDef: { cell?: Renderable<TContexte> } };
  getContext: () => TContexte;
};

/** Ce dont le contenu partagé a besoin, et rien de plus. */
export type TableauAvecLignes<TContexte extends object> = {
  getRowModel: () => {
    rows: Array<{
      id: string;
      getVisibleCells: () => CelluleAffichable<TContexte>[];
    }>;
  };
};

/** Ce dont le conteneur partagé a besoin : en-têtes, lignes, et la pagination. */
export type TableauComplet<
  TContexteEnTete extends object,
  TContexteCellule extends object,
> = TableauAvecEnTetes<TContexteEnTete> &
  TableauAvecLignes<TContexteCellule> & {
    setPageIndex: (index: number) => void;
    getPageCount: () => number;
  };

/** Ce dont la pagination partagée a besoin, et rien de plus. */
export type TableauPaginable = {
  previousPage: () => void;
  nextPage: () => void;
};
