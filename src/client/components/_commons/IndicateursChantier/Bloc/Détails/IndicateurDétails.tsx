import { FunctionComponent, useState } from 'react';
import '@gouvfr/dsfr/dist/component/accordion/accordion.min.css';
import IndicateurÉvolution from '@/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/IndicateurÉvolution';
import Titre from '@/components/_commons/Titre/Titre';
import CartographieAvancement
  from '@/components/_commons/Cartographie/CartographieAvancementNew/CartographieAvancement';
import CartographieValeurActuelle
  from '@/components/_commons/Cartographie/CartographieValeurActuelleNew/CartographieValeurActuelle';
import useCartographie from '@/components/_commons/Cartographie/useCartographieNew';
import IndicateurSpécifications
  from '@/components/_commons/IndicateursChantier/Bloc/Détails/Spécifications/IndicateurSpécifications';
import {
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import {
  ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieValeurActuelle';
import SousIndicateurs from '@/components/_commons/IndicateursChantier/Bloc/Détails/SousIndicateurs/SousIndicateurs';

import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { useIndicateurDétails } from './useIndicateurDétails';

interface IndicateurDétailsProps {
  indicateur: Indicateur
  indicateurDétailsParTerritoires: IndicateurDétailsParTerritoire[]
  chantierEstTerritorialisé: boolean
  dateDeMiseAJourIndicateur: string | null
  listeSousIndicateurs: Indicateur[]
  détailsIndicateurs: DétailsIndicateurs
  detailsIndicateursTerritoire: DétailsIndicateurs
  estSousIndicateur?: boolean
  dateValeurActuelle: string | null
  dateProchaineDateMaj: string | null
  dateProchaineDateValeurActuelle: string | null
  territoireCode: string
  mailleSelectionnee: MailleInterne
  indicateurEstAjour: boolean
}

const IndicateurDétails: FunctionComponent<IndicateurDétailsProps> = ({
  indicateur,
  indicateurDétailsParTerritoires,
  chantierEstTerritorialisé,
  dateDeMiseAJourIndicateur,
  listeSousIndicateurs,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  dateValeurActuelle,
  dateProchaineDateMaj,
  dateProchaineDateValeurActuelle,
  estSousIndicateur = false,
  territoireCode,
  mailleSelectionnee,
  indicateurEstAjour,
}) => {
  const [futOuvert, setFutOuvert] = useState(false);

  const { auClicTerritoireMultiSélectionCallback } = useCartographie(territoireCode, mailleSelectionnee, '/chantier/[id]/[territoireCode]');

  const {
    donnéesCartographieAvancement,
    donnéesCartographieValeurActuelle,
    donnéesCartographieAvancementTerritorialisées,
    donnéesCartographieValeurActuelleTerritorialisées,
  } = useIndicateurDétails(indicateur.id, futOuvert, mailleSelectionnee, detailsIndicateursTerritoire[indicateur.id]);

  const indicateurSiTypeDeReformeEstChantier = futOuvert && !!donnéesCartographieAvancement && !!donnéesCartographieValeurActuelle;
  const nomDefinitionDeLindicateur = estSousIndicateur ? 'Description du sous-indicateur et calendrier de mise à jour' : 'Description de l\'indicateur et calendrier de mise à jour';
  const nomRepartitionGeographiqueEtEvolution = 'Répartition géographique et évolution';
  const nomSousIndicateurs = 'Sous indicateurs';

  return (
    <div className='fr-accordions-group'>
      <section className='fr-accordion'>
        <h3 className='fr-accordion__title'>
          <button
            aria-controls={`détails-${indicateur.id}`}
            aria-expanded='false'
            className='fr-accordion__btn'
            onClick={() => setFutOuvert(true)}
            title={nomDefinitionDeLindicateur}
            type='button'
          >
            {nomDefinitionDeLindicateur}
          </button>
        </h3>
        <div
          className='fr-collapse'
          id={`détails-${indicateur.id}`}
        >
          <div className='fr-container'>
            <div className='fr-grid-row fr-grid-row--gutters fr-mb-1w'>
              <div className='fr-col-12'>
                {
                  indicateurSiTypeDeReformeEstChantier ? (
                    <IndicateurSpécifications
                      dateProchaineDateMaj={dateProchaineDateMaj}
                      dateProchaineDateValeurActuelle={dateProchaineDateValeurActuelle}
                      dateValeurActuelle={dateValeurActuelle}
                      delaiDisponibilite={indicateur.delaiDisponibilite}
                      description={indicateur.description}
                      indicateurEstAjour={indicateurEstAjour}
                      modeDeCalcul={indicateur.modeDeCalcul}
                      periodicite={indicateur.periodicite}
                      source={indicateur.source}
                    />
                  ) : null
                }
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className='fr-accordion'>
        <h3 className='fr-accordion__title'>
          <button
            aria-controls={`repartition-geographique-et-evolution-${indicateur.id}`}
            aria-expanded='false'
            className='fr-accordion__btn'
            onClick={() => setFutOuvert(true)}
            title={nomRepartitionGeographiqueEtEvolution}
            type='button'
          >
            {nomRepartitionGeographiqueEtEvolution}
          </button>
        </h3>
        <div
          className='fr-collapse'
          id={`repartition-geographique-et-evolution-${indicateur.id}`}
        >
          <div className='fr-container'>
            <div className='fr-grid-row fr-grid-row--gutters fr-my-1w'>
              {
                indicateurSiTypeDeReformeEstChantier && (donnéesCartographieAvancementTerritorialisées || chantierEstTerritorialisé) ?
                  <section className='fr-col-12 fr-col-xl-6'>
                    <Titre
                      baliseHtml='h5'
                      className='fr-text--lg'
                    >
                      Répartition géographique de l'avancement 2026
                    </Titre>
                    <CartographieAvancement
                      auClicTerritoireCallback={auClicTerritoireMultiSélectionCallback}
                      données={donnéesCartographieAvancement}
                      mailleSelectionnee={mailleSelectionnee}
                      options={{ multiséléction: true }}
                      pathname='/chantier/[id]/[territoireCode]'
                      territoireCode={territoireCode}
                      élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
                    />
                  </section> : null
              }
              {
                indicateurSiTypeDeReformeEstChantier && (donnéesCartographieValeurActuelleTerritorialisées || chantierEstTerritorialisé) ?
                  <section className='fr-col-12 fr-col-xl-6'>
                    <Titre
                      baliseHtml='h5'
                      className='fr-text--lg'
                    >
                      Répartition géographique de la valeur actuelle de l'indicateur
                    </Titre>
                    <CartographieValeurActuelle
                      auClicTerritoireCallback={auClicTerritoireMultiSélectionCallback}
                      données={donnéesCartographieValeurActuelle}
                      mailleSelectionnee={mailleSelectionnee}
                      options={{ multiséléction: true }}
                      pathname='/chantier/[id]/[territoireCode]'
                      territoireCode={territoireCode}
                      unité={indicateur.unité}
                      élémentsDeLégende={ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE}
                    />
                  </section> : null
              }
              {
                // TODO(JOTA-02/08/2024): Supprimer indicateurDétailsParTerritoires[0]?.données une fois le refacto page chantier terminé
                indicateurSiTypeDeReformeEstChantier && indicateurDétailsParTerritoires[0]?.données ? (
                  <section className='fr-col-12'>
                    <IndicateurÉvolution
                      dateDeMiseAJourIndicateur={dateDeMiseAJourIndicateur ?? 'Non renseignée'}
                      indicateurDétailsParTerritoires={indicateurDétailsParTerritoires}
                      source={indicateur.source}
                    />
                  </section>
                ) : null
              }
            </div>
          </div>
        </div>
      </section>
      {
        listeSousIndicateurs.length > 0 &&
        <section className='fr-accordion'>
          <h3 className='fr-accordion__title'>
            <button
              aria-controls={`sous-indicateurs-${indicateur.id}`}
              aria-expanded='false'
              className='fr-accordion__btn'
              onClick={() => setFutOuvert(true)}
              title={nomSousIndicateurs}
              type='button'
            >
              {nomSousIndicateurs}
            </button>
          </h3>
          <div
            className='fr-collapse fr-m-0 fr-p-0'
            id={`sous-indicateurs-${indicateur.id}`}
          >
            <SousIndicateurs
              chantierEstTerritorialisé={chantierEstTerritorialisé}
              detailsIndicateursTerritoire={detailsIndicateursTerritoire}
              détailsIndicateurs={détailsIndicateurs}
              estInteractif
              listeSousIndicateurs={listeSousIndicateurs}
              mailleSelectionnee={mailleSelectionnee}
              territoireCode={territoireCode}
            />
          </div>
        </section>
      }
    </div>
  );
};

export default IndicateurDétails;
