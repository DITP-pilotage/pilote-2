import { ColumnDef } from '@tanstack/react-table';

export default interface TableauProps<T extends object> {
  colonnes: ColumnDef<T, any>[],
  donnees: T[],
  titre: string
}