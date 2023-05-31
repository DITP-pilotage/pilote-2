import { Table } from '@tanstack/react-table';

export default interface TableauProps<T extends object> {
  tableau:  Table<T>
  titre: string,
}
