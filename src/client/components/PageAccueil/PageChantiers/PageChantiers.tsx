import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/link/link.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css';
import Link from 'next/link';
import { useState } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Avancements from '@/components/_commons/Avancements/Avancements';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import ExportDesDonnées, {
  ID_HTML_MODALE_EXPORT,
} from '@/components/PageAccueil/PageChantiers/ExportDesDonnées/ExportDesDonnées';
import {
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import FiltresActifs from '@/client/components/PageAccueil/FiltresActifs/FiltresActifs';
import RépartitionMétéo from '@/components/_commons/RépartitionMétéo/RépartitionMétéo';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import RemontéeAlerte from '@/components/PageAccueil/PageChantiers/RemontéeAlerte/RemontéeAlerte';
import PageChantiersStyled from './PageChantiers.styled';
import PageChantiersProps from './PageChantiers.interface';
import TableauChantiers from './TableauChantiers/TableauChantiers';
import usePageChantiers from './usePageChantiers';

export default function PageChantiers({ chantiers }: PageChantiersProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const { auClicTerritoireCallback } = useCartographie();

  const [nombreChantiersDansLeTableau, setNombreChantiersDansLeTableau] = useState<number>();

  const {
    nombreFiltresActifs,
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographieAvancement,
    donnéesTableauChantiers,
  } = usePageChantiers(chantiers);

  const alertes = [
    {
      libellé: 'Écart(s) supérieur(s) de 10 points à la moyenne nationale',
      nombre: null,
      estActivée: false,
    },
    {
      libellé: 'Tendance(s) en baisse ou en stagnation',
      nombre: 10,
      estActivée: true,
    },
    {
      libellé: 'Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour',
      nombre: 15,
      estActivée: false,
    },
  ];

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
            {`${chantiersFiltrés.length} ${chantiersFiltrés.length >= 2 ? 'chantiers' : 'chantier'}`}
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
                <TitreInfobulleConteneur>
                  <Titre
                    baliseHtml="h2"
                    className="fr-text--lg"
                    estInline
                  >
                    Taux d’avancement moyen
                  </Titre>
                  <Infobulle idHtml="infobulle-chantiers-jauges">
                    { INFOBULLE_CONTENUS.chantiers.jauges }
                  </Infobulle>
                </TitreInfobulleConteneur>
                <Avancements avancements={avancementsAgrégés} />
              </section>
              <hr className="fr-hr fr-mt-3w fr-mb-3v fr-pb-1v" />
              <section>
                <TitreInfobulleConteneur>
                  <Titre
                    baliseHtml="h2"
                    className="fr-text--lg"
                    estInline
                  >
                    Répartition des météos renseignées
                  </Titre>
                  <Infobulle idHtml="infobulle-chantiers-météos">
                    { INFOBULLE_CONTENUS.chantiers.météos }
                  </Infobulle>
                </TitreInfobulleConteneur>
                <RépartitionMétéo météos={répartitionMétéos} />
              </section>
            </Bloc>
          </div>
        </div>
        <div className="fr-pt-2w fr-px-2w fr-px-md-0">
          <div>
            <TitreInfobulleConteneur>
              <Titre
                baliseHtml="h2"
                className="fr-text--lg fr-mb-0"
                estInline
              >
                Chantiers signalés
              </Titre>
            </TitreInfobulleConteneur>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters">
            {
              alertes.map(({ libellé, nombre, estActivée }) => (
                <div
                  className="fr-col"
                  key={libellé}
                >
                  <RemontéeAlerte
                    estActivée={estActivée}
                    libellé={libellé}
                    nombre={nombre}
                  />
                </div>
              ))
            }
          </div>
        </div>
        <div className="fr-grid-row fr-mt-7v">
          <div className="fr-col">
            <Bloc>
              <TitreInfobulleConteneur>
                <Titre
                  baliseHtml="h2"
                  className="fr-text--lg fr-mb-0"
                  estInline
                >
                  Liste des chantiers (
                  { nombreChantiersDansLeTableau }
                  )
                </Titre>
                <Infobulle idHtml="infobulle-chantiers-listeDesChantiers">
                  { INFOBULLE_CONTENUS.chantiers.listeDesChantiers }
                </Infobulle>
              </TitreInfobulleConteneur>
              <TableauChantiers
                données={donnéesTableauChantiers}
                setNombreChantiersDansLeTableau={setNombreChantiersDansLeTableau}
              />
            </Bloc>
          </div>
        </div>
      </div>
    </PageChantiersStyled>
  );
}
