import { Table } from '@tanstack/react-table';
import { DonnéesTableauChantiers } from '../TableauChantiers.interface';

export default interface TableauChantiersContenuProps {
  tableau: Table<DonnéesTableauChantiers>
}
