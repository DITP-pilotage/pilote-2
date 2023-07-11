import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta {
    width?: string
    tabIndex?: number
  }
}
