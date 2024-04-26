import { Table } from '@tanstack/react-table';
import { UtilisateurListeGestion } from '@/server/app/contrats/UtilisateurListeGestion';

export default interface TableauAdminUtilisateursContenuProps {
  tableau: Table<UtilisateurListeGestion>
}
