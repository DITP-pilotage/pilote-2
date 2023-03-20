import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import météos from '@/client/constants/météos';
import ListeChantiersMétéoProps from '@/components/PageChantiers/ListeChantiersTableau/Météo/ListeChantiersMétéo.interface';

export default function ListeChantiersMétéo({ météo }: ListeChantiersMétéoProps) {
  return météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE'
    ? <PictoMétéo valeur={météo} />
    : (
      <span className="texte-gris fr-text--xs">
        {météos[météo]}
      </span>
    );
}
