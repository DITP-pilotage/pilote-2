import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { libellésMétéos } from '@/server/domain/météo/Météo.interface';
import TableauRéformesMétéoProps from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.interface';

export default function TableauRéformesMétéo({ météo }: TableauRéformesMétéoProps) {
  return météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE'
    ? <MétéoPicto météo={météo} />
    : (
      <span className="texte-gris fr-text--xs">
        {libellésMétéos[météo]}
      </span>
    );
}
