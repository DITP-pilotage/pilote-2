import { useMemo } from 'react';
import préparerDonnéesCartographie from '@/client/utils/cartographie/préparerDonnéesCartographie';
import { calculerMoyenne } from '@/client/utils/statistiques';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import CartographieTauxAvancement from '@/components/_commons/Cartographie/CartographieTauxAvancement/CartographieTauxAvancement';
import CartesProps from './Cartes.interface';

export default function Cartes({ chantier }: CartesProps) {  
  const donnéesCartographie = useMemo(() => (
    préparerDonnéesCartographie(
      [chantier.mailles],
      (territoiresAgrégés) => {
        const valeurs = territoiresAgrégés.avancement.map(avancement => avancement.global);
        return calculerMoyenne(valeurs);
      },
    )
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
            <p className='fr-grid-row fr-grid-row--center'>
              <CartographieTauxAvancement données={donnéesCartographie} />
            </p>
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
            <p className='fr-grid-row fr-grid-row--center'>
              A venir...
            </p>
          </Bloc>
        </div>
      </div>
    </div>
  );
}
