import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import { calculerMoyenne } from '@/client/utils/statistiques';
import préparerDonnéesCartographie from '@/client/utils/cartographie/préparerDonnéesCartographie';
import CartographieTauxAvancement from '@/components/_commons/Cartographie/CartographieTauxAvancement/CartographieTauxAvancement';
import RépartitionGéographiqueProps from './RépartitionGéographique.interface';

export default function RépartitionGéographique({ chantiers }: RépartitionGéographiqueProps) {
  const donnéesCartographie = useMemo(() => (
    préparerDonnéesCartographie(
      chantiers.map(chantier => chantier.mailles),
      (territoiresAgrégés) => {
        const valeurs = territoiresAgrégés.avancement.map(avancement => avancement.global);
        return calculerMoyenne(valeurs);
      },
    )
  ), [chantiers]);

  return (
    <>
      <Titre
        baliseHtml='h2'
        className='fr-h6'
      >
        Répartition géographique
      </Titre>
      <CartographieTauxAvancement données={donnéesCartographie} />
    </>
  );
}
