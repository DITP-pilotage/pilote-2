import {
  CellData,
  Column,
  RowData,
  Table,
  TableFeatures,
} from "@tanstack/react-table";

type BaseFiltre = {
  label: string;
  getOptionLabel(value: string): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hidden?(table: Table<any, any>): boolean;
};

declare module "@tanstack/react-table" {
  export type FiltreMultiselectOptionGroup = {
    label: string;
    options: string[];
  };

  interface ColumnMeta<
    in out TFeatures extends TableFeatures,
    in out TData extends RowData,
    TValue extends CellData = CellData,
  > {
    width?: string;
    tabIndex?: number;
    filter?:
      | (BaseFiltre & {
          type: "checkboxes";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getOptions(column: Column<any, any>): string[];
        })
      | (BaseFiltre & {
          type: "multiselect";
          getPlaceholder(values: string[]): string;
          getOptionGroups(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            column: Column<any, any>,
          ): FiltreMultiselectOptionGroup[];
        })
      | (BaseFiltre & {
          type: "tags";
          labelToutesLesOptions: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange?(value: string | null, table: Table<any, any>): void;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getOptions(column: Column<any, any>): string[];
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
