import { ChantierDeLaPageChantiers } from '../PageChantiers/PageChantiers.interface';

export default interface ListeChantiersProps {
  chantiers: Pick<ChantierDeLaPageChantiers, 'id' | 'nom' | 'meteo' | 'avancement'>[]
}
