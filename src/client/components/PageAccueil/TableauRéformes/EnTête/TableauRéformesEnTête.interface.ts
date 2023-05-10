import { Table } from '@tanstack/react-table';
import { DonnéesTableauChantiers } from '@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface TableauRéformesEnTêteProps {
  tableau: Table<DonnéesTableauChantiers | ProjetStructurant>
}
