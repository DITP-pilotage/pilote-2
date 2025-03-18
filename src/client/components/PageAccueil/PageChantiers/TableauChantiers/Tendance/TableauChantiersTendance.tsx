import { FunctionComponent } from 'react';
import Badge from '@/components/_commons/Badge/Badge';
import { DonnéesTableauChantiers } from '@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface';
import { badgeTypeÀPartirDeLaTendance, libelléÀPartirDeLaTendance } from '@/client/utils/chantier/tendance/tendance';
import Icône from '@/components/_commons/Icône/Icône';
  
interface TableauChantiersTendanceProps {
  tendance: DonnéesTableauChantiers['tendance']
  estArchive?: boolean
}
  
const TableauChantiersTendance: FunctionComponent<TableauChantiersTendanceProps> = ({ tendance, estArchive }) => {

  if (tendance === null) {
    return null;
  }

  return (
    <Badge type={estArchive ? 'gris' : badgeTypeÀPartirDeLaTendance[tendance]}>
      <div className='flex align-center'>
        {
          tendance === 'HAUSSE' ? (
            <Icône
              className='fr-text--xs fr-mr-1v'
              id='material-symbols::north_east::outlined'
            />
          ) : tendance === 'BAISSE' ? (
            <Icône
              className='fr-text--xs fr-mr-1v'
              id='material-symbols::south_east::outlined'
            />
          ) : (
            <Icône
              className='fr-text--xs fr-mr-1v'
              id='material-symbols::east::outlined'
            />
          )
        }
      </div>
      {libelléÀPartirDeLaTendance[tendance]}
    </Badge>
  );
};

export default TableauChantiersTendance;
