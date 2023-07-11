import Badge from '@/components/_commons/Badge/Badge';
import TableauChantiersÉcartProps from '@/components/PageAccueil/PageChantiers/TableauChantiers/Écart/TableauChantiersÉcart.interface';
import { définirCouleurÉcartArrondi } from '@/client/utils/chantier/écart/écart';

export default function TableauChantiersÉcart({ écart }: TableauChantiersÉcartProps) {
  const couleurÉcartArrondi = définirCouleurÉcartArrondi(écart);

  if (couleurÉcartArrondi === null) {
    return null;
  }

  return (
    <Badge type={couleurÉcartArrondi.couleur}>
      {couleurÉcartArrondi.écartArrondi.toFixed(1)}
      %
    </Badge>
  );
}
