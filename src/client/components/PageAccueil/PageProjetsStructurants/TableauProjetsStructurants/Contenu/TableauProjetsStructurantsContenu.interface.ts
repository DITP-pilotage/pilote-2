import { Table } from '@tanstack/react-table';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface TableauProjetsStructurantsContenuProps {
  tableau: Table<ProjetStructurant>
}
