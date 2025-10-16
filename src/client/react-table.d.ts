import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta {
    width?: string;
    tabIndex?: number;
    filter?: {
      label: string;
      labelToutesLesOptions: string;
      getValueLabel(value: string): string;
    };
    grouping?: {
      label: string;
    };
    sticky?: "left";
    stickyOffset?: number;
  }
}
