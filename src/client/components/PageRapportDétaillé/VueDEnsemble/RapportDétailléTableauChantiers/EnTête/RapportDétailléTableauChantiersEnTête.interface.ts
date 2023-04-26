import { Table } from '@tanstack/react-table';
import { DonnéesTableauChantiers } from '@/components/PageChantiers/TableauChantiers/TableauChantiers.interface';

export default interface TableauChantiersEnTêteProps {
  tableau: Table<DonnéesTableauChantiers>
}
