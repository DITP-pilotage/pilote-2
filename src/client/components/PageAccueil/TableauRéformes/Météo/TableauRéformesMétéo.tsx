import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { libellésMétéos } from '@/server/domain/météo/Météo.interface';
import TableauRéformesMétéoProps from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.interface';
import { formaterDate } from '@/client/utils/date/date';
import TableauRéformesMétéoStyled from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.styled';

export default function TableauRéformesMétéo({ météo, dateDeMàjDonnéesQualitatives, taille = 'md' }: TableauRéformesMétéoProps) {
  return (
    <TableauRéformesMétéoStyled taille={taille}>
      {
        météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE'
          ?
            <MétéoPicto météo={météo} />
          : (
            taille === 'sm' ? (
              <span className="texte-gris texte-centre fr-text--xs">
                –
              </span>
            ) : (
              <span className="texte-gris fr-text--xs">
                {libellésMétéos[météo]}
              </span>
            )
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
