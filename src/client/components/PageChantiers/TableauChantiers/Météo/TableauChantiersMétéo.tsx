import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import météos from '@/client/constants/météos';
import TableauChantiersMétéoProps from '@/components/PageChantiers/TableauChantiers/Météo/TableauChantiersMétéo.interface';

export default function TableauChantiersMétéo({ météo }: TableauChantiersMétéoProps) {
  return météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE'
    ? <MétéoPicto météo={météo} />
    : (
      <span className="texte-gris fr-text--xs">
        {météos[météo]}
      </span>
    );
}
