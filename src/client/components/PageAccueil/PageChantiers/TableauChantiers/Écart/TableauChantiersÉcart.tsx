import Badge from '@/components/_commons/Badge/Badge';
import TableauChantiersÉcartProps
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/Écart/TableauChantiersÉcart.interface';
import TableauChantiersÉcartStyled from '@/components/PageAccueil/PageChantiers/TableauChantiers/Écart/TableauChantiersÉcart.styled';
import { définirCouleurÉcartArrondi } from '@/client/utils/chantier/écart/écart';

export default function TableauChantiersÉcart({ écart }: TableauChantiersÉcartProps) {
  const couleurÉcartArrondi = définirCouleurÉcartArrondi(écart);

  if (couleurÉcartArrondi === null) {
    return null;
  }

  return (
    <TableauChantiersÉcartStyled>
      <Badge type={couleurÉcartArrondi.couleur}>
        {couleurÉcartArrondi.écartArrondi.toFixed(1)}
        %
      </Badge>
    </TableauChantiersÉcartStyled>
  );
}
