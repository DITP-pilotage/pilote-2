import { mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import Bloc from '@/components/_commons/Bloc/Bloc';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import CartographieMétéo from '@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo';
import Titre from '@/components/_commons/Titre/Titre';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import CartesProps from './Cartes.interface';

export default function Cartes({ chantier, estInteractif = true }: CartesProps) {  
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const { auClicTerritoireCallback } = useCartographie();

  const donnéesCartographieAvancement = objectEntries(chantier.mailles[mailleSélectionnée]).map(([codeInsee, territoire]) => ({
    valeur: territoire.avancement.global,
    codeInsee: codeInsee,
  }));

  const donnéesCartographieMétéo = objectEntries(chantier.mailles[mailleSélectionnée]).map(([codeInsee, territoire]) => ({
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
                estInteractif={estInteractif}
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
                estInteractif={estInteractif}
              />
            </section>
          </Bloc>
        </div>
      </div>
    </section>
  );
}
