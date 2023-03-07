import { useState } from 'react';
import IndicateurÉvolution from '@/components/PageChantier/Indicateurs/Bloc/Détails/Évolution/IndicateurÉvolution';
import Titre from '@/components/_commons/Titre/Titre';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import CartographieValeurActuelle from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import IndicateurDescription
  from '@/components/PageChantier/Indicateurs/Bloc/Détails/Description/IndicateurDescription';
import IndicateurDétailsProps from './IndicateurDétails.interface';
import useIndicateurDétails from './useIndicateurDétails';

export default function IndicateurDétails({ indicateurId, indicateurDétailsParTerritoires }: IndicateurDétailsProps) {
  const [futOuvert, setFutOuvert] = useState(false);
  const { auClicTerritoireMultiSélectionCallback } = useCartographie();
  const { donnéesCartographieAvancement, donnéesCartographieValeurActuelle } = useIndicateurDétails(indicateurId, futOuvert);

  return (
    <div className="fr-accordion">
      <div className="fr-accordion__title">
        <button
          aria-controls={`détails-${indicateurId}`}
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
        id={`détails-${indicateurId}`}
      >
        <div className="fr-container">
          <div className="fr-grid-row fr-grid-row--gutters fr-mb-1w">
            <div className="fr-col-12">
              <IndicateurDescription />
            </div>
            <div className="fr-col-12 fr-col-xl-6">
              <Titre
                baliseHtml='h4'
                className='fr-text--lg'
              >
                Répartition géographique de l&apos;avancement
              </Titre>
              <CartographieAvancement
                auClicTerritoireCallback={auClicTerritoireMultiSélectionCallback}
                données={donnéesCartographieAvancement}
                options={{ territoireSélectionnable: true, multiséléction: true }}
              />
            </div>
            <div className="fr-col-12 fr-col-xl-6">
              <Titre
                baliseHtml='h4'
                className='fr-text--lg'
              >
                Répartition géographique de la valeur actuelle de l&apos;indicateur
              </Titre>
              <CartographieValeurActuelle
                auClicTerritoireCallback={auClicTerritoireMultiSélectionCallback}
                données={donnéesCartographieValeurActuelle}
                options={{ territoireSélectionnable: true, multiséléction: true }}
              />
            </div>
          </div>
        </div>
        <hr className='fr-hr' />
        <IndicateurÉvolution indicateurDétailsParTerritoires={indicateurDétailsParTerritoires} />
      </div>
    </div>
  );
}
