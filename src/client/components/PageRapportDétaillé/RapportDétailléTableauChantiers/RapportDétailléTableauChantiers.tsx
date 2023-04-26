import '@gouvfr/dsfr/dist/component/table/table.min.css';
import '@gouvfr/dsfr/dist/component/notice/notice.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-map/icons-map.min.css';
import Titre from '@/components/_commons/Titre/Titre';
import useRapportDétailléTableauChantiers
  from '@/components/PageRapportDétaillé/RapportDétailléTableauChantiers/useRapportDétailléTableauChantiers';
import RapportDétailléTableauChantiersProps from './RapportDétailléTableauChantiers.interface';
import RapportDétailléTableauChantiersStyled from './RapportDétailléTableauChantiers.styled';
import RapportDétailléTableauChantiersEnTête from './EnTête/RapportDétailléTableauChantiersEnTête';
import RapportDétailléTableauChantiersContenu from './Contenu/RapportDétailléTableauChantiersContenu';

export default function RapportDétailléTableauChantiers({ données }: RapportDétailléTableauChantiersProps) {
  const { tableau } = useRapportDétailléTableauChantiers(données);

  return (
    <RapportDétailléTableauChantiersStyled className='fr-table fr-m-0 fr-p-0'>
      <Titre
        baliseHtml="h2"
        className="fr-h6 fr-mb-2w"
      >
        {`Liste des chantiers (${tableau.getFilteredRowModel().rows.length})`}
      </Titre>
      {
        tableau.getRowModel().rows.length === 0
          ?
            <div className="fr-notice fr-notice--info">
              <div className="fr-container">
                <div className="fr-notice__body">
                  <p className="fr-notice__title">
                    Aucun chantier à afficher.
                  </p>
                </div>
              </div>
            </div>
          :
            <table className='tableau'>
              <caption className="fr-sr-only">
                Liste des chantiers
              </caption>
              <RapportDétailléTableauChantiersEnTête tableau={tableau} />
              <RapportDétailléTableauChantiersContenu tableau={tableau} />
            </table>
      }
    </RapportDétailléTableauChantiersStyled>
  );
}
