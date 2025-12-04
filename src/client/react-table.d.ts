import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta {
    width?: string;
    tabIndex?: number;
    filter?: {
      type: "multi";
      label: string;
      labelToutesLesOptions: string;
      getValueLabel(value: string): string;
    };
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
