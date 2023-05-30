import '@gouvfr/dsfr/dist/component/table/table.min.css';
import { useEffect } from 'react';
import TableauAdminUtilisateursProps
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateursProps.interface';
import useTableauPageAdminUtilisateurs
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/useTableauAdminUtilisateurs';
import TableauEnTête from '@/components/_commons/Tableau/EnTête/TableauEnTête';
import TableauContenu from '@/components/_commons/Tableau/Contenu/TableauContenu';
import TableauPagination from '@/components/_commons/Tableau/Pagination/TableauPagination';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import TableauAdminUtilisateursStyled
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs.styled';

export default function TableauAdminUtilisateurs({ utilisateurs } :TableauAdminUtilisateursProps) {

  const { tableau, changementDePageCallback } = useTableauPageAdminUtilisateurs(utilisateurs);

  useEffect(() => {
    tableau.setPageSize(50);
  }, [tableau]);

  return (
    <TableauAdminUtilisateursStyled>
      <div className="fr-table">
        <table className='tableau fr-m-0 fr-p-0'>
          <caption className="fr-sr-only">
            Tableau des utilisateurs
          </caption>
          <TableauEnTête<Utilisateur> tableau={tableau} />
          <TableauContenu<Utilisateur> tableau={tableau} />
        </table>
        <TableauPagination
          changementDePageCallback={changementDePageCallback}
          nombreDePages={tableau.getPageCount()}
          numéroDePageInitiale={1}
        />
      </div>
    </TableauAdminUtilisateursStyled>
  );
}
