import { FunctionComponent } from 'react';
import Encart from '@/components/_commons/Encart/Encart';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import CartographieAvancement
  from '@/components/_commons/Cartographie/CartographieAvancementNew/CartographieAvancement';
import Avancements from '@/components/_commons/Avancements/Avancements';
import RépartitionMétéo from '@/components/_commons/RépartitionMétéo/RépartitionMétéo';
import usePageRapportDétaillé from '@/components/PageRapportDétaillé/usePageRapportDétaillé';
import { htmlId } from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import {
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import RapportDétailléVueDEnsembleStyled
  from '@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble.styled';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import BadgeIcône from '@/components/_commons/BadgeIcône/BadgeIcône';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import RemontéeAlerte from '@/components/_commons/RemontéeAlerte/RemontéeAlerte';
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
  RépartitionsMétéos,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { TypeAlerteChantier } from '@/server/chantiers/app/contrats/TypeAlerteChantier';
import RapportDétailléTableauChantiers from './RapportDétailléTableauChantiers/RapportDétailléTableauChantiers';

interface RapportDétailléVueDEnsembleProps {
  chantiers: ChantierRapportDetailleContrat[]
  filtresComptesCalculés: Record<TypeAlerteChantier, number>
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat
  répartitionMétéos: RépartitionsMétéos
  territoireCode: string
  mailleSelectionnee: 'départementale' | 'régionale'
}

const RapportDétailléVueDEnsemble: FunctionComponent<RapportDétailléVueDEnsembleProps> = ({
  chantiers,
  répartitionMétéos,
  avancementsGlobauxTerritoriauxMoyens: donnéesCartographie,
  avancementsAgrégés,
  territoireCode,
  filtresComptesCalculés,
  mailleSelectionnee,
}) => {
  const {
    donnéesTableauChantiers,
    remontéesAlertes,
  } = usePageRapportDétaillé(chantiers, territoireCode, filtresComptesCalculés, avancementsAgrégés);

  return (
    <RapportDétailléVueDEnsembleStyled>
      <Encart>
        <Titre
          baliseHtml='h2'
          className='fr-h2 fr-mb-0'
        >
          Vue d'ensemble
        </Titre>
      </Encart>
      <div className='fr-mt-3w avancements-météos-carto impression-section'>
        <Bloc>
          <section>
            <TitreInfobulleConteneur>
              <Titre
                baliseHtml='h2'
                className='fr-text--lg fr-mb-2w fr-py-1v'
                estInline
              >
                Taux d’avancement moyen
              </Titre>
              <Infobulle idHtml='infobulle-chantiers-jauges'>
                {INFOBULLE_CONTENUS.chantiers.jauges}
              </Infobulle>
            </TitreInfobulleConteneur>
            <Avancements avancements={avancementsAgrégés} />
          </section>
          <hr className='fr-hr fr-my-3w fr-pb-1v' />
          <section>
            <TitreInfobulleConteneur>
              <Titre
                baliseHtml='h2'
                className='fr-text--lg fr-mb-0 fr-py-1v'
                estInline
              >
                Répartition des météos renseignées
              </Titre>
              <Infobulle idHtml='infobulle-chantiers-météos'>
                {INFOBULLE_CONTENUS.chantiers.météos}
              </Infobulle>
            </TitreInfobulleConteneur>
            <RépartitionMétéo météos={répartitionMétéos} />
          </section>
        </Bloc>
        <Bloc>
          <section>
            <Titre
              baliseHtml='h3'
              className='fr-text--lg fr-mb-0 fr-py-1v'
            >
              Taux d’avancement des politiques prioritaires par territoire
            </Titre>
            <CartographieAvancement
              auClicTerritoireCallback={() => {}}
              données={donnéesCartographie}
              mailleSelectionnee={mailleSelectionnee}
              options={{ estInteractif: false }}
              pathname={null}
              territoireCode={territoireCode}
              élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
            />
          </section>
        </Bloc>
      </div>
      {
        process.env.NEXT_PUBLIC_FF_ALERTES === 'true' &&
        <div className='fr-pt-3w fr-px-2w fr-px-md-0 alertes'>
          <div className='fr-mb-2w'>
            <TitreInfobulleConteneur>
              <BadgeIcône type='warning' />
              <Titre
                baliseHtml='h2'
                className='fr-text--lg fr-mb-0 fr-py-1v fr-ml-1w titre-remontée-alertes'
                estInline
              >
                Politiques prioritaires signalées
              </Titre>
              <Infobulle idHtml='infobulle-chantiers-alertes'>
                {INFOBULLE_CONTENUS.chantiers.alertes}
              </Infobulle>
            </TitreInfobulleConteneur>
          </div>
          <div className='fr-grid-row fr-grid-row--gutters'>
            {
              remontéesAlertes.map(({ nomCritère, libellé, nombre, estActivée }) => (
                (process.env.NEXT_PUBLIC_FF_ALERTES_BAISSE === 'true' || nomCritère !== 'estEnAlerteBaisse') &&
                <div
                  className='fr-col'
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
      }
      <div
        className='fr-grid-row fr-mt-7v impression-section'
        id={htmlId.listeDesChantiers()}
      >
        <div className='fr-col'>
          <Bloc>
            <TitreInfobulleConteneur className='fr-mb-1w'>
              <Titre
                baliseHtml='h2'
                className='fr-text--lg fr-mb-0 fr-py-1v'
                estInline
              >
                Liste des politiques prioritaires
              </Titre>
              <Infobulle idHtml='infobulle-chantiers-listeDesChantiers'>
                {INFOBULLE_CONTENUS.chantiers.listeDesChantiers}
              </Infobulle>
            </TitreInfobulleConteneur>
            <RapportDétailléTableauChantiers
              données={donnéesTableauChantiers}
            />
          </Bloc>
        </div>
      </div>
    </RapportDétailléVueDEnsembleStyled>
  );
};

export default RapportDétailléVueDEnsemble;
