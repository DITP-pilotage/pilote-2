import { FunctionComponent } from 'react';
import Badge from '@/components/_commons/Badge/Badge';
import { DonneesComparaisonDuTauxDAvancementType } from '@/server/domain/territoire/Territoire.interface';
import { badgeTypeÀPartirDeLaTendance, libelléÀPartirDeLaTendance } from '@/client/utils/chantier/tendance/tendance';
import Icône from '@/components/_commons/Icône/Icône';

interface TendanceTauxAvancementPPGProps {
  tendance: DonneesComparaisonDuTauxDAvancementType['ppgTendanceChantier']
  estArchive?: boolean
}
  
const TendanceTauxAvancementPPG: FunctionComponent<TendanceTauxAvancementPPGProps> = ({ tendance, estArchive }) => {

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

export default TendanceTauxAvancementPPG;
