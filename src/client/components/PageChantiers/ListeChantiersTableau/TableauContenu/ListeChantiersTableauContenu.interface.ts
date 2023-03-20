import { Table } from '@tanstack/react-table';
import { DonnéesTableauChantiers } from '../ListeChantiersTableau.interface';

export default interface ListeChantiersTableauContenuProps {
  tableau: Table<DonnéesTableauChantiers>
}
