import { Table } from '@tanstack/react-table';
import { DonnéesTableauChantiers } from '../ListeChantiersTableau.interface';

export default interface ListeChantiersTableauEnTêteProps {
  tableau: Table<DonnéesTableauChantiers>
}
