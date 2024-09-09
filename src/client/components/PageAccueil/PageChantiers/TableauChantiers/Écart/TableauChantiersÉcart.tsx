import { FunctionComponent } from 'react';
import Badge from '@/components/_commons/Badge/Badge';
import { définirCouleurÉcartArrondi } from '@/client/utils/chantier/écart/écart';
import {
  DonnéesTableauChantiers,
} from '@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface';

interface TableauChantiersÉcartProps {
  écart: DonnéesTableauChantiers['écart']
}

const TableauChantiersÉcart: FunctionComponent<TableauChantiersÉcartProps> = ({ écart }) => {
  const couleurÉcartArrondi = définirCouleurÉcartArrondi(écart);

  if (couleurÉcartArrondi === null) {
    return null;
  }

  return (
    <Badge type={couleurÉcartArrondi.couleur}>
      {couleurÉcartArrondi.écartArrondi.toFixed(1)}
    </Badge>
  );
};

export default TableauChantiersÉcart;
