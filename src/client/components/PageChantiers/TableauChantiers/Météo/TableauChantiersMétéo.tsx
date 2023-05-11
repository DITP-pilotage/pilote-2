import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import TableauChantiersMétéoProps from '@/components/PageChantiers/TableauChantiers/Météo/TableauChantiersMétéo.interface';
import { libellésMétéos } from '@/server/domain/météo/Météo.interface';

export default function TableauChantiersMétéo({ météo }: TableauChantiersMétéoProps) {
  return météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE'
    ? <MétéoPicto météo={météo} />
    : (
      <span className="texte-gris fr-text--xs">
        {libellésMétéos[météo]}
      </span>
    );
}
