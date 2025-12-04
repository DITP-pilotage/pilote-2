import { Column, Table } from "@tanstack/react-table";

type BaseFiltre = {
  label: string;
  getOptionLabel(value: string): string;
  hidden?(table: Table<any>): boolean;
};

declare module "@tanstack/react-table" {
  export type FiltreMultiselectOptionGroup = {
    label: string;
    options: string[];
  };

  interface ColumnMeta {
    width?: string;
    tabIndex?: number;
    filter?:
      | (BaseFiltre & {
          type: "checkboxes";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getOptions(column: Column<any>): string[];
        })
      | (BaseFiltre & {
          type: "multiselect";
          getPlaceholder(values: string[]): string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getOptionGroups(column: Column<any>): FiltreMultiselectOptionGroup[];
        })
      | (BaseFiltre & {
          type: "tags";
          labelToutesLesOptions: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange?(value: string | null, table: Table<any>): void;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getOptions(column: Column<any>): string[];
        });
    grouping?: {
      label: string;
    };
    positioning?: {
      sticky?: "left";
      stickyOffset?: number;
      lastInGroup?: boolean;
    };
  }
}
