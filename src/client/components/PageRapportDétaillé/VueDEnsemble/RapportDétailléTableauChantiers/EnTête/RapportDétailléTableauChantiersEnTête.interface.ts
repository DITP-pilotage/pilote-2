import { Table } from '@tanstack/react-table';
import { DonnéesTableauChantiers } from '@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface';

export default interface TableauChantiersEnTêteProps {
  tableau: Table<DonnéesTableauChantiers>
}
