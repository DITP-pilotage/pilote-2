import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';
import TableauRéformesMétéoProps from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.interface';
import { formaterDate } from '@/client/utils/date/date';
import TableauRéformesMétéoStyled from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.styled';

const libelléMétéosÀPartirDeLaTaille = {
  'sm': {
    className: 'texte-centre',
    texte: (_: Météo) => '–',
  },
  'md': {
    className: '',
    texte: (météo: Météo) => libellésMétéos[météo],
  },
};

export default function TableauRéformesMétéo({ météo, dateDeMàjDonnéesQualitatives, taille = 'md' }: TableauRéformesMétéoProps) {
  return (
    <TableauRéformesMétéoStyled taille={taille}>
      {
        météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE'
          ?
            <div className='fr-ml-1w'>
              <MétéoPicto
                estVisibleParLecteurDÉcran
                météo={météo}
              />
            </div>
          : (
            <span className={`fr-text--xs texte-gris ${libelléMétéosÀPartirDeLaTaille[taille].className}`}>
              { libelléMétéosÀPartirDeLaTaille[taille].texte(météo) }
            </span>
          )
      }
      {
        !!dateDeMàjDonnéesQualitatives && process.env.NEXT_PUBLIC_FF_DATE_METEO === 'true' &&
        <span className='texte-gris'>
          {`(${ formaterDate(dateDeMàjDonnéesQualitatives, 'MM/YYYY') })`}
        </span>
      }
    </TableauRéformesMétéoStyled>
  );
}
