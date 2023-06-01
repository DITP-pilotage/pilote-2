import TableauUtilisateurProps from '@/components/PageUtilisateur/TableauUtilisateur/TableauUtilisateur.interface';

export default function TableauUtilisateur({ utilisateur }: TableauUtilisateurProps) {
  return (
    <div className='fr-table'>
      <table>
        <thead>
          <tr>
            <th>
              Adresse email
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
              Dernière modification
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {utilisateur.email}
            </td>
            <td>
              {utilisateur.nom}
            </td>
            <td>
              {utilisateur.prénom}
            </td>
            <td>
              {utilisateur.profil}
            </td>
            <td>
              Non renseigné
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
