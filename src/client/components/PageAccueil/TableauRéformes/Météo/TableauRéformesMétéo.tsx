import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { libellésMétéos } from '@/server/domain/météo/Météo.interface';
import TableauRéformesMétéoProps from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.interface';
import { formaterDate } from '@/client/utils/date/date';
import TableauRéformesMétéoStyled from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.styled';

export default function TableauRéformesMétéo({ météo, dateDeMàjDonnéesQualitatives }: TableauRéformesMétéoProps) {
  return (
    <TableauRéformesMétéoStyled>
      {
        météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE'
          ?
            <MétéoPicto météo={météo} />
          : (
            <span className="texte-gris fr-text--xs">
              {libellésMétéos[météo]}
            </span>
          )
      }
      {
        !!dateDeMàjDonnéesQualitatives &&
        <span className='texte-gris'>
          (
          { formaterDate(dateDeMàjDonnéesQualitatives, 'MM/YYYY') }
          )
        </span>
      }
    </TableauRéformesMétéoStyled>
  );
}
