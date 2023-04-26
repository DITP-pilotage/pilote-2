import { Table } from '@tanstack/react-table';
import { DonnéesTableauChantiers } from '@/client/components/PageChantiers/TableauChantiers/TableauChantiers.interface';

export default interface TableauChantiersContenuProps {
  tableau: Table<DonnéesTableauChantiers>
}
