import { FunctionComponent } from 'react';
import { formaterDate } from '@/client/utils/date/date';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

interface TableauUtilisateurProps {
  utilisateur: {
    nom: string
    prénom: string
    email: string
    profil: ProfilCode
    dateModification?: string
    auteurModification?: string
    dateCreation?: string
    auteurCreation?: string
    fonction: string | null
  } 
}

const TableauUtilisateur: FunctionComponent<TableauUtilisateurProps> = ({ utilisateur }) => {
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
            {
              !!utilisateur.auteurCreation &&
              <th>
                Création du compte
              </th>
            }
            {
              !!utilisateur.auteurModification &&
              <th>
                Dernière modification
              </th>
            }
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
            {
              !!utilisateur.auteurCreation &&
              <td title={`${formaterDate(utilisateur.dateCreation, 'DD/MM/YYYY')} par ${utilisateur.auteurCreation}`}>
                {`${formaterDate(utilisateur.dateCreation, 'DD/MM/YYYY')} par ${utilisateur.auteurCreation}`}
              </td>
            }
            {
              !!utilisateur.auteurModification &&
              <td title={`${formaterDate(utilisateur.dateModification, 'DD/MM/YYYY')} par ${utilisateur.auteurModification}`}>
                {`${formaterDate(utilisateur.dateModification, 'DD/MM/YYYY')} par ${utilisateur.auteurModification}`}
              </td>
            }
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TableauUtilisateur;
