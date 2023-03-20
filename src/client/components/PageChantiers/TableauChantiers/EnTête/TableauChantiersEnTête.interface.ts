import { Table } from '@tanstack/react-table';
import { DonnéesTableauChantiers } from '@/client/components/PageChantiers/TableauChantiers/TableauChantiers.interface';

export default interface TableauChantiersEnTêteProps {
  tableau: Table<DonnéesTableauChantiers>
}
