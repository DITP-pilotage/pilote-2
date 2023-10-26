import { Table } from '@tanstack/react-table';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';

export default interface TableauAdminIndicateursContenuProps {
  tableau: Table<MetadataParametrageIndicateurContrat>
}
