import '@gouvfr/dsfr/dist/component/table/table.min.css';
import '@gouvfr/dsfr/dist/component/notice/notice.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-map/icons-map.min.css';
import { FunctionComponent } from 'react';
import useRapportDétailléTableauChantiers
  from '@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléTableauChantiers/useRapportDétailléTableauChantiers';
import RapportDétailléTableauChantiersProps from './RapportDétailléTableauChantiers.interface';
import RapportDétailléTableauChantiersStyled from './RapportDétailléTableauChantiers.styled';
import RapportDétailléTableauChantiersEnTête from './EnTête/RapportDétailléTableauChantiersEnTête';
import RapportDétailléTableauChantiersContenu from './Contenu/RapportDétailléTableauChantiersContenu';

const RapportDétailléTableauChantiers: FunctionComponent<RapportDétailléTableauChantiersProps> = ({ données }) => {
  const { tableau } = useRapportDétailléTableauChantiers(données);

  return (
    <RapportDétailléTableauChantiersStyled className='fr-table fr-m-0 fr-p-0'>
      {
        tableau.getRowModel().rows.length === 0
          ?
            <div className='fr-notice fr-notice--info'>
              <div className='fr-container'>
                <div className='fr-notice__body'>
                  <p className='fr-notice__title'>
                    Aucune poltique prioritaire à afficher.
                  </p>
                </div>
              </div>
            </div>
          :
            <table className='tableau'>
              <caption className='fr-sr-only'>
                Liste des Politiques Prioritaires
              </caption>
              <RapportDétailléTableauChantiersEnTête tableau={tableau} />
              <RapportDétailléTableauChantiersContenu tableau={tableau} />
            </table>
      }
    </RapportDétailléTableauChantiersStyled>
  );
};

export default RapportDétailléTableauChantiers;
