import styled from '@emotion/styled';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { libellésMétéos } from '@/server/domain/météo/Météo.interface';
import TableauRéformesMétéoProps from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.interface';
import { formaterDate } from '@/client/utils/date/date';

const TableauRéformesMétéoStyled = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  font-size: 0.625rem;
`;

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
      <span className='texte-gris'>
        (
        { formaterDate(dateDeMàjDonnéesQualitatives, 'MM/YYYY') }
        )
      </span>
    </TableauRéformesMétéoStyled>
  );
}
