import { useState } from 'react';
import IndicateurÉvolution from '@/components/_commons/Indicateurs/Bloc/Détails/Évolution/IndicateurÉvolution';
import Titre from '@/components/_commons/Titre/Titre';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import CartographieValeurActuelle from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import IndicateurSpécifications from '@/components/_commons/Indicateurs/Bloc/Détails/Spécifications/IndicateurSpécifications';
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import IndicateurDétailsProps from './IndicateurDétails.interface';
import useIndicateurDétails from './useIndicateurDétails';

export default function IndicateurDétails({ indicateur, indicateurDétailsParTerritoires, typeDeRéforme }: IndicateurDétailsProps) {
  const [futOuvert, setFutOuvert] = useState(false);
  const { auClicTerritoireMultiSélectionCallback } = useCartographie();
  const { donnéesCartographieAvancement, donnéesCartographieValeurActuelle } = useIndicateurDétails(indicateur.id, futOuvert);

  return (
    <div className="fr-accordion">
      <div className="fr-accordion__title">
        <button
          aria-controls={`détails-${indicateur.id}`}
          aria-expanded="false"
          className="fr-accordion__btn"
          onClick={() => setFutOuvert(true)}
          type="button"
        >
          Détails
        </button>
      </div>
      <div
        className="fr-collapse"
        id={`détails-${indicateur.id}`}
      >
        {
          typeDeRéforme === 'projet structurant' &&
            <IndicateurSpécifications
              description={indicateur.description}
              modeDeCalcul={indicateur.modeDeCalcul}
              source={indicateur.source}
            />
        }
        {
          typeDeRéforme === 'chantier' && !!futOuvert && !!donnéesCartographieAvancement && !!donnéesCartographieValeurActuelle &&
          <>
            <div className="fr-container">
              <div className="fr-grid-row fr-grid-row--gutters fr-mb-1w">
                <div className="fr-col-12">
                  <IndicateurSpécifications
                    description={indicateur.description}
                    modeDeCalcul={indicateur.modeDeCalcul}
                    source={indicateur.source}
                  />
                </div>
                <section className="fr-col-12 fr-col-xl-6">
                  <Titre
                    baliseHtml='h5'
                    className='fr-text--lg'
                  >
                    Répartition géographique de l&apos;avancement
                  </Titre>
                  <CartographieAvancement
                    auClicTerritoireCallback={auClicTerritoireMultiSélectionCallback}
                    données={donnéesCartographieAvancement}
                    options={{ multiséléction: true }}
                    élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
                  />
                </section>
                <section className="fr-col-12 fr-col-xl-6">
                  <Titre
                    baliseHtml='h5'
                    className='fr-text--lg'
                  >
                    Répartition géographique de la valeur actuelle de l&apos;indicateur
                  </Titre>
                  <CartographieValeurActuelle
                    auClicTerritoireCallback={auClicTerritoireMultiSélectionCallback}
                    données={donnéesCartographieValeurActuelle}
                    options={{ multiséléction: true }}
                  />
                </section>
              </div>
            </div>
            <hr className='fr-hr' />
            <IndicateurÉvolution indicateurDétailsParTerritoires={indicateurDétailsParTerritoires} />
          </>
        }
      </div>
    </div>
  );
}
