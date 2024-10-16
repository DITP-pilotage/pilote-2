import { FunctionComponent, useState } from 'react';
import '@gouvfr/dsfr/dist/component/accordion/accordion.min.css';
import IndicateurÉvolution
  from '@/components/_commons/IndicateursProjetStructurant/Bloc/Détails/Évolution/IndicateurÉvolution';
import Titre from '@/components/_commons/Titre/Titre';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import CartographieValeurActuelle
  from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import IndicateurSpécifications
  from '@/components/_commons/IndicateursProjetStructurant/Bloc/Détails/Spécifications/IndicateurSpécifications';
import {
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import {
  ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieValeurActuelle';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/IndicateursProjetStructurant/Bloc/IndicateurBloc.interface';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import useIndicateurDétails from './useIndicateurDétails';

interface IndicateurDétailsProps {
  indicateur: Indicateur
  indicateurDétailsParTerritoires: IndicateurDétailsParTerritoire[]
  typeDeRéforme: TypeDeRéforme,
  chantierEstTerritorialisé: boolean,
  dateDeMiseAJourIndicateur: string
}

const IndicateurDétails: FunctionComponent<IndicateurDétailsProps> = ({
  indicateur,
  indicateurDétailsParTerritoires,
  typeDeRéforme,
  chantierEstTerritorialisé,
  dateDeMiseAJourIndicateur,
}) => {

  const [futOuvert, setFutOuvert] = useState(false);
  const { auClicTerritoireMultiSélectionCallback } = useCartographie();
  const {
    donnéesCartographieAvancement,
    donnéesCartographieValeurActuelle,
    donnéesCartographieAvancementTerritorialisées,
    donnéesCartographieValeurActuelleTerritorialisées,
  } = useIndicateurDétails(indicateur.id, futOuvert, typeDeRéforme);

  const indicateurSiTypeDeReformeEstChantier = typeDeRéforme === 'chantier' && futOuvert && !!donnéesCartographieAvancement && !!donnéesCartographieValeurActuelle;
  const nomDefinitionDeLindicateur = 'Définition de l\'indicateur';
  const nomRepartitionGeographiqueEtEvolution = 'Répartition géographique et évolution';

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
                  ((typeDeRéforme === 'projet structurant') || (indicateurSiTypeDeReformeEstChantier)) ?
                    <IndicateurSpécifications
                      description={indicateur.description}
                      modeDeCalcul={indicateur.modeDeCalcul}
                      source={indicateur.source}
                    />
                    : null
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
                indicateurSiTypeDeReformeEstChantier && (donnéesCartographieAvancementTerritorialisées || chantierEstTerritorialisé) ? (
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
                      options={{ multiséléction: true }}
                      élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
                    />
                  </section>
                ) : null
              }
              {
                (indicateurSiTypeDeReformeEstChantier) && (donnéesCartographieValeurActuelleTerritorialisées || chantierEstTerritorialisé) ? (
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
                      options={{ multiséléction: true }}
                      unité={indicateur.unité}
                      élémentsDeLégende={ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE}
                    />
                  </section>
                ) : null
              }
              {
                indicateurSiTypeDeReformeEstChantier ? (
                  <section className='fr-col-12'>
                    <IndicateurÉvolution
                      dateDeMiseAJourIndicateur={dateDeMiseAJourIndicateur}
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
    </div>
  );
};

export default IndicateurDétails;
