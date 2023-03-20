import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import météos from '@/client/constants/météos';
import TableauChantiersMétéoProps from '@/components/PageChantiers/TableauChantiers/Météo/TableauChantiersMétéo.interface';

export default function TableauChantiersMétéo({ météo }: TableauChantiersMétéoProps) {
  return météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE'
    ? <PictoMétéo valeur={météo} />
    : (
      <span className="texte-gris fr-text--xs">
        {météos[météo]}
      </span>
    );
}
