import { useMemo } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import CartographieTauxAvancement from '@/components/_commons/Cartographie/CartographieTauxAvancement/CartographieTauxAvancement';
import CartographieMétéo from '@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import CartesProps from './Cartes.interface';

export default function Cartes({ chantier }: CartesProps) {
  const { préparerDonnéesCartographieÀPartirDUnÉlément } = useCartographie();

  const donnéesCartographieAvancement = useMemo(() => (
    préparerDonnéesCartographieÀPartirDUnÉlément(chantier.mailles, territoire => territoire.avancement.global)
  ), [chantier.mailles, préparerDonnéesCartographieÀPartirDUnÉlément]);
  
  const donnéesCartographieMétéo = useMemo(() => (
    préparerDonnéesCartographieÀPartirDUnÉlément(chantier.mailles, territoire => territoire.météo)
  ), [chantier.mailles, préparerDonnéesCartographieÀPartirDUnÉlément]);

  return (
    <div 
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
            <Titre
              baliseHtml='h4'
              className='fr-text--lg'
            >
              Taux d&apos;avancement
            </Titre>
            <CartographieTauxAvancement
              données={donnéesCartographieAvancement}
              mailleInterne="départementale"
            />
          </Bloc>
        </div>
        <div className="fr-col-12 fr-col-xl-6">
          <Bloc>
            <Titre
              baliseHtml='h4'
              className='fr-text--lg'
            >
              Niveau de confiance
            </Titre>
            <CartographieMétéo
              données={donnéesCartographieMétéo}
              mailleInterne="départementale"
            />
          </Bloc>
        </div>
      </div>
    </div>
  );
}
