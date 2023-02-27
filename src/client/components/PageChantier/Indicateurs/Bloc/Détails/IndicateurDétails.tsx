import IndicateurÉvolution from '@/components/PageChantier/Indicateurs/Bloc/Détails/Évolution/IndicateurÉvolution';
import { mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import Titre from '@/components/_commons/Titre/Titre';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import CartographieValeurActuelle
  from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle';
import IndicateurDétailsProps from './IndicateurDétails.interface';

export default function IndicateurDétails({ indicateur }: IndicateurDétailsProps) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const donnéesCartographieAvancement = objectEntries(indicateur.mailles[mailleSélectionnée])
    .map(([codeInsee, territoire]) => (
      {
        valeur: territoire.tauxAvancementGlobal,
        codeInsee: codeInsee,
      }
    ));

  const donnéesCartographieValeurActuelle = {
    libelléUnité: '',
    données: objectEntries(indicateur.mailles[mailleSélectionnée])
      .map(([codeInsee, territoire]) => (
        {
          valeur: territoire.valeurActuelle,
          codeInsee: codeInsee,
        }
      )),
  };

  return (
    <div className="fr-accordion">
      <div className="fr-accordion__title">
        <button
          aria-controls={`détails-${indicateur.id}`}
          aria-expanded="false"
          className="fr-accordion__btn"
          type="button"
        >
          Détails
        </button>
      </div>
      <div
        className="fr-collapse fr-ml-3w"
        id={`détails-${indicateur.id}`}
      >
        <div className="fr-grid-row fr-grid-row--gutters fr-mb-1w">
          <div className="fr-col-12 fr-col-xl-6">
            <Titre
              baliseHtml='h4'
              className='fr-text--lg'
            >
              Répartition géographique de l&apos;avancement
            </Titre>
            <CartographieAvancement
              données={donnéesCartographieAvancement}
              options={{ territoireSélectionnable: true }}
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
              données={donnéesCartographieValeurActuelle}
              options={{ territoireSélectionnable: true }}
            />
          </div>
        </div>
        <IndicateurÉvolution indicateur={indicateur} />
      </div>
    </div>
  );
}
