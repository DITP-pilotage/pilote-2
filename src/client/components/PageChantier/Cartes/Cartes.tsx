import { useMemo } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import CartographieTauxAvancement from '@/components/_commons/Cartographie/CartographieTauxAvancement/CartographieTauxAvancement';
import { préparerDonnéesCartographieÀPartirDUnÉlément } from '@/client/utils/cartographie/préparerDonnéesCartographie';
import CartographieMétéo from '@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo';
import CartesProps from './Cartes.interface';

export default function Cartes({ chantier }: CartesProps) {
  const donnéesCartographieAvancement = useMemo(() => (
    préparerDonnéesCartographieÀPartirDUnÉlément(chantier.mailles, territoire => territoire.avancement.global)
  ), [chantier]);
  
  const donnéesCartographieMétéo = useMemo(() => (
    préparerDonnéesCartographieÀPartirDUnÉlément(chantier.mailles, territoire => territoire.météo)
  ), [chantier]);

  return (
    <div 
      className='fr-pb-5w'
      id="cartes"
    >
      <Titre baliseHtml='h2'>
        Cartes
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
        <div className="fr-col-12 fr-col-xl-6">
          <Bloc>
            <Titre
              baliseHtml='h4'
              className='fr-text--lg'
            >
              Répartition géographique du taux d’avancement du chantier
            </Titre>
            <CartographieTauxAvancement
              données={donnéesCartographieAvancement}
              niveauDeMaille="départementale"
            />
          </Bloc>
        </div>
        <div className="fr-col-12 fr-col-xl-6">
          <Bloc>
            <Titre
              baliseHtml='h4'
              className='fr-text--lg'
            >
              Répartition géographique du niveau de confiance
            </Titre>
            <CartographieMétéo
              données={donnéesCartographieMétéo}
              niveauDeMaille="départementale"
            />
          </Bloc>
        </div>
      </div>
    </div>
  );
}
