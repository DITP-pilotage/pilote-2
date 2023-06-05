import TableauUtilisateurProps from '@/components/PageUtilisateur/TableauUtilisateur/TableauUtilisateur.interface';
import { formaterDate } from '@/client/utils/date/date';

export default function TableauUtilisateur({ utilisateur }: TableauUtilisateurProps) {
  return (
    <div className='fr-table'>
      <table>
        <thead>
          <tr>
            <th>
              Adresse électronique
            </th>
            <th>
              Nom
            </th>
            <th>
              Prénom
            </th>
            <th>
              Profil
            </th>
            <th>
              Fonction
            </th>
            <th>
              Dernière modification
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td title={utilisateur.email}>
              {utilisateur.email}
            </td>
            <td title={utilisateur.nom}>
              {utilisateur.nom}
            </td>
            <td title={utilisateur.prénom}>
              {utilisateur.prénom}
            </td>
            <td title={utilisateur.profil}>
              {utilisateur.profil}
            </td>
            <td title={utilisateur.fonction ?? undefined}>
              {utilisateur.fonction}
            </td>
            <td title={`${formaterDate(utilisateur.dateModification, 'jj/mm/aaaa')} par ${utilisateur.auteurModification}`}>
              {`${formaterDate(utilisateur.dateModification, 'jj/mm/aaaa')} par ${utilisateur.auteurModification}`}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
