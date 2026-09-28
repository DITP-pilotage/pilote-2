import type { ReactNode } from "react";
import type { AppReactTable, Column } from "@tanstack/react-table";

// Les briques partagées reçoivent une instance dont le jeu de features varie d'une page à
// l'autre : en v9 aucun type concret ne les réunit. Seule `shared/DataTable/` manipule ce type,
// et chaque brique vérifie la présence d'une feature (`hasFeature`) avant d'en appeler les méthodes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTable = AppReactTable<any, any, any, any, any, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyColumn = Column<any, any, any>;

export type FilterOption = { value: string; label: string };

export type FilterDescriptor =
  | { type: "checkboxes"; label: string; options: FilterOption[] }
  | {
      type: "multiselect";
      label: string;
      options: FilterOption[];
      className?: string;
      buttonClassName?: string;
    };

export type DataTableColumnMeta = {
  label?: string;
  sortButton?: boolean;
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
  filter?: FilterDescriptor;
};

export type EmptyMessage = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export type EmptyConfig =
  EmptyMessage | { noData: EmptyMessage; noResults: EmptyMessage };
