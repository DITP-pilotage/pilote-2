import { Table } from '@tanstack/react-table';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default interface TableauAdminUtilisateursContenuProps {
  tableau: Table<Utilisateur>
}
