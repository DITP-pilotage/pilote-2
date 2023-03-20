import { Table } from '@tanstack/react-table';
import { DonnéesTableauChantiers } from '../TableauChantiers.interface';

export default interface TableauChantiersEnTêteProps {
  tableau: Table<DonnéesTableauChantiers>
}
