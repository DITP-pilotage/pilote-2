import Titre from '@/components/_commons/Titre/Titre';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import CartographieValeurActuelle
  from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle';
import { objectEntries } from '@/client/utils/objects/objects';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';

export default function IndicateurCartes({ indicateur }: { indicateur: Indicateur }) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const donnéesCartographieAvancement = objectEntries(indicateur.mailles[mailleSélectionnée])
    .map(([codeInsee, territoire]) => (
      {
        valeur: territoire.tauxAvancementGlobal,
        codeInsee: codeInsee,
      }
    ));

  const donnéesCartographieValeurActuelle = {
    libelléUnité: "en nombre d'unités",
    données: objectEntries(indicateur.mailles[mailleSélectionnée])
      .map(([codeInsee, territoire]) => (
        {
          valeur: territoire.valeurActuelle,
          codeInsee: codeInsee,
        }
      )),
  };

  return (
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
  );
}
