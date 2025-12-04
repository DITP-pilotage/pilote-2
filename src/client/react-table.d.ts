import { Column } from "@tanstack/react-table";

type BaseFiltre = {
  label: string;
  getOptionLabel(value: string): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOptions(column: Column<any>): string[];
};

declare module "@tanstack/react-table" {
  interface ColumnMeta {
    width?: string;
    tabIndex?: number;
    filter?:
      | (BaseFiltre & {
          type: "checkboxes";
        })
      | (BaseFiltre & {
          type: "multiselect";
        })
      | (BaseFiltre & {
          type: "tags";
          labelToutesLesOptions: string;
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
