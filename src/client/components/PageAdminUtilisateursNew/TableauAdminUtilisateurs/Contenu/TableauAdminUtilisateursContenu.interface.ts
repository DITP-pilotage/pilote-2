import { Table } from '@tanstack/react-table';
import { UtilisateurListeGestionContrat } from '@/server/app/contrats/UtilisateurListeGestionContrat';

export default interface TableauAdminUtilisateursContenuProps {
  tableau: Table<UtilisateurListeGestionContrat>
}
