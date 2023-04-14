import { mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import Bloc from '@/components/_commons/Bloc/Bloc';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import CartographieMétéo from '@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo';
import Titre from '@/components/_commons/Titre/Titre';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import RépartitionGéographiqueProps from './RépartitionGéographique.interface';

export default function RépartitionGéographique({ données }: RépartitionGéographiqueProps) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const { auClicTerritoireCallback } = useCartographie();

  const donnéesCartographieAvancement = objectEntries(données[mailleSélectionnée]).map(([codeInsee, territoire]) => ({
    valeur: territoire.avancement.global,
    codeInsee: codeInsee,
  }));

  const donnéesCartographieMétéo = objectEntries(données[mailleSélectionnée]).map(([codeInsee, territoire]) => ({
    valeur: territoire.météo,
    codeInsee: codeInsee,
  }));

  return (
    <section
      id="cartes"
    >
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Répartition géographique
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-xl-6">
          <Bloc>
            <section>
              <Titre
                baliseHtml='h3'
                className='fr-text--lg'
              >
                Taux d&apos;avancement
              </Titre>
              <CartographieAvancement
                auClicTerritoireCallback={auClicTerritoireCallback}
                données={donnéesCartographieAvancement}
                options={{ territoireSélectionnable: true }}
              />
            </section>
          </Bloc>
        </div>
        <div className="fr-col-12 fr-col-xl-6">
          <Bloc>
            <section>
              <Titre
                baliseHtml='h3'
                className='fr-text--lg'
              >
                Niveau de confiance
              </Titre>
              <CartographieMétéo
                auClicTerritoireCallback={auClicTerritoireCallback}
                données={donnéesCartographieMétéo}
                options={{ territoireSélectionnable: true }}
              />
            </section>
          </Bloc>
        </div>
      </div>
    </section>
  );
}
