import Badge from '@/components/_commons/Badge/Badge';
import TableauChantiersÉcartProps
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/Écart/TableauChantiersÉcart.interface';
import TableauChantiersÉcartStyled from '@/components/PageAccueil/PageChantiers/TableauChantiers/Écart/TableauChantiersÉcart.styled';

export default function TableauChantiersÉcart({ écart }: TableauChantiersÉcartProps) {
  const écartArrondi = écart !== null ? Number(écart.toFixed(1)) : null;

  if (écartArrondi === null) {
    return null;
  }

  return (
    <TableauChantiersÉcartStyled>
      <Badge
        type={
        écartArrondi > 10
          ? 'vert'
          : (écartArrondi < -10 ? 'rouge' : 'bleu')
      }
      >
        {écartArrondi === -0 ? '0.0' : écartArrondi.toFixed(1)}
        %
      </Badge>
    </TableauChantiersÉcartStyled>
  );
}
