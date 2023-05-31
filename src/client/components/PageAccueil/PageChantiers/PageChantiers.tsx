import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/link/link.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css';
import Link from 'next/link';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Avancements from '@/components/_commons/Avancements/Avancements';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import ExportDesDonnées, { ID_HTML_MODALE_EXPORT } from '@/components/PageAccueil/PageChantiers/ExportDesDonnées/ExportDesDonnées';
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import FiltresActifs from '@/client/components/PageAccueil/FiltresActifs/FiltresActifs';
import PageChantiersStyled from './PageChantiers.styled';
import PageChantiersProps from './PageChantiers.interface';
import TableauChantiers from './TableauChantiers/TableauChantiers';
import usePageChantiers from './usePageChantiers';
import RépartitionMétéo from './RépartitionMétéo/RépartitionMétéo';

export default function PageChantiers({ chantiers }: PageChantiersProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const { auClicTerritoireCallback } = useCartographie();
  const {
    nombreFiltresActifs,
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographieAvancement,
    donnéesTableauChantiers,
  } = usePageChantiers(chantiers);

  return (
    <PageChantiersStyled>
      {
        nombreFiltresActifs > 0 &&
        <FiltresActifs />
      }
      <div className="fr-py-2w fr-px-md-4w fr-container--fluid">
        <div className="fr-mb-2w titre">
          <Titre
            baliseHtml="h1"
            className="fr-h4 fr-px-2w fr-px-md-0 fr-mb-1w"
          >
            {`${chantiersFiltrés.length} chantiers`}
          </Titre>
          <div className="titre-liens">
            {
              process.env.NEXT_PUBLIC_FF_RAPPORT_DETAILLE === 'true' &&
              <div>
                <Link
                  className="fr-btn fr-btn--tertiary-no-outline fr-icon-article-line fr-btn--icon-left fr-text--sm"
                  href={`/rapport-detaille?territoireCode=${territoireSélectionné!.code}`}
                  title="Voir le rapport détaillé"
                >
                  Voir le rapport détaillé
                </Link>
              </div>
            }
            {
              process.env.NEXT_PUBLIC_FF_EXPORT_CSV === 'true' &&
              <div>
                <button
                  aria-controls={ID_HTML_MODALE_EXPORT}
                  className="fr-btn fr-btn--tertiary-no-outline fr-icon-download-line fr-btn--icon-left fr-text--sm"
                  data-fr-opened="false"
                  type="button"
                >
                  Exporter les données
                </button>
                <ExportDesDonnées />
              </div>
            }
          </div>
        </div>
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-lg-6">
            <Bloc>
              <section>
                <Titre
                  baliseHtml="h2"
                  className="fr-text--lg"
                >
                  Taux d’avancement des chantiers par territoire
                </Titre>
                <CartographieAvancement
                  auClicTerritoireCallback={auClicTerritoireCallback}
                  données={donnéesCartographieAvancement}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
                />
              </section>
            </Bloc>
          </div>
          <div className="fr-col-12 fr-col-lg-6">
            <Bloc>
              <section>
                <Titre
                  baliseHtml="h2"
                  className="fr-text--lg"
                >
                  Taux d’avancement moyen
                </Titre>
                <Avancements avancements={avancementsAgrégés} />
              </section>
              <hr className="fr-hr fr-my-3w fr-pb-1v" />
              <RépartitionMétéo météos={répartitionMétéos} />
            </Bloc>
          </div>
        </div>
        <div className="fr-grid-row fr-mt-7v">
          <div className="fr-col">
            <Bloc>
              <TableauChantiers
                données={donnéesTableauChantiers}
              />
            </Bloc>
          </div>
        </div>
      </div>
    </PageChantiersStyled>
  );
}
