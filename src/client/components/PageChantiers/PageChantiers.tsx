import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/link/link.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import SélecteursMaillesEtTerritoires
  from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import Avancements from '@/components/_commons/Avancements/Avancements';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import Filtres from '@/components/PageChantiers/Filtres/Filtres';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoireSélectionnéTerritoiresStore, actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import ExportDesDonnées, { ID_HTML_MODALE_EXPORT } from '@/components/PageChantiers/ExportDesDonnées/ExportDesDonnées';
import PageChantiersProps from './PageChantiers.interface';
import RépartitionMétéo from './RépartitionMétéo/RépartitionMétéo';
import FiltresActifs from './FiltresActifs/FiltresActifs';
import TableauChantiers from './TableauChantiers/TableauChantiers';
import usePageChantiers from './usePageChantiers';

export default function PageChantiers({ chantiers, ministères, axes, ppg, habilitations }: PageChantiersProps) {
  const habilitation = new Habilitation(habilitations);
  const territoireFiltre = habilitation.récupérerMailleEtCodeEnLecture();
  const maille = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();

  const { initialiserValeursParDéfaut } = actionsTerritoiresStore();
  useEffect(() => {
    initialiserValeursParDéfaut(territoireFiltre);
  }, [territoireFiltre, initialiserValeursParDéfaut]);


  const codeInsee = territoireSélectionnéTerritoiresStore().codeInsee;
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const { auClicTerritoireCallback } = useCartographie();
  const {
    nombreFiltresActifs,
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographie,
    donnéesTableauChantiers,
  } = usePageChantiers(chantiers);

  return (
    <div className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          <SélecteursMaillesEtTerritoires 
            habilitation={habilitation}
          />
        </BarreLatéraleEncart>
        <section>
          <Titre
            baliseHtml="h1"
            className="fr-h4 fr-mb-1w fr-px-3w fr-mt-2w fr-col-8"
          >
            Filtres
          </Titre>
          <Filtres
            axes={axes}
            ministères={ministères}
            ppg={ppg}
          />
        </section>
      </BarreLatérale>
      <main>
        <button
          className="fr-sr-only-xl fr-btn fr-btn--secondary fr-mb-2w"
          onClick={() => setEstOuverteBarreLatérale(true)}
          title="Ouvrir les filtres"
          type="button"
        >
          Filtres
        </button>
        <div>
          {
            nombreFiltresActifs > 0 &&
            <FiltresActifs />
          }
          <div className="fr-py-2w fr-px-md-4w fr-container--fluid">
            <div className="fr-px-2w fr-px-md-0 flex justify-between">
              <Titre
                baliseHtml="h1"
                className="fr-h4"
              >
                {`${chantiersFiltrés.length} chantiers`}
              </Titre>
              <div className="flex">
                {
                  process.env.NEXT_PUBLIC_FF_RAPPORT_DETAILLE === 'true' &&
                  <div>
                    <Link
                      className="fr-btn fr-btn--tertiary-no-outline fr-icon-article-line fr-btn--icon-left fr-text--sm"
                      href={`/rapport-detaille?maille=${maille}&codeInsee=${codeInsee}`}
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
                      données={donnéesCartographie}
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
                  <section>
                    <Titre
                      baliseHtml="h2"
                      className="fr-text--lg"
                    >
                      Répartition des météos renseignées
                    </Titre>
                    <RépartitionMétéo météos={répartitionMétéos} />
                  </section>
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
        </div>
      </main>
    </div>
  );
}
