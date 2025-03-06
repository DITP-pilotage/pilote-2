import 'material-symbols/index.css';
import 'material-icons/iconfont/material-icons.css';
import { FunctionComponent } from 'react';
import Badge from '@/components/_commons/Badge/Badge';
import { DonneesComparaisonDuTauxDAvancementType } from '@/server/domain/territoire/Territoire.interface';
import { badgeTypeÀPartirDeLaTendance, libelléÀPartirDeLaTendance } from '@/client/utils/chantier/tendance/tendance';

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
            <span className='material-symbols-outlined fr-text--xs fr-mr-1w'>
              north_east
            </span>
          ) : tendance === 'BAISSE' ? (
            <span className='material-symbols-outlined fr-text--xs fr-mr-1w'>
              south_east
            </span>
          ) : (
            <span className='material-symbols-outlined fr-text--xs fr-mr-1w'>
              east
            </span>
          )
        }
      </div>
      {libelléÀPartirDeLaTendance[tendance]}
    </Badge>
  );
};

export default TendanceTauxAvancementPPG;
