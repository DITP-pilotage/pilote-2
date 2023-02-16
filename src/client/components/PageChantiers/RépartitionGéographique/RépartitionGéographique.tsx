import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import { calculerMoyenne } from '@/client/utils/statistiques/statistiques';
import CartographieTauxAvancement from '@/components/_commons/Cartographie/CartographieTauxAvancement/CartographieTauxAvancement';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import { mailleSélectionnéeTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import RépartitionGéographiqueProps from './RépartitionGéographique.interface';

export default function RépartitionGéographique({ donnéesTerritoiresAgrégées }: RépartitionGéographiqueProps) {
  const { préparerDonnéesCartographieÀPartirDUneListe } = useCartographie();

  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const donnéesCartographie = useMemo(() => (
    préparerDonnéesCartographieÀPartirDUneListe(
      donnéesTerritoiresAgrégées,
      (territoiresAgrégés) => {
        const valeurs = territoiresAgrégés.avancement.map(avancement => avancement.global);
        return calculerMoyenne(valeurs);
      },
    )
  ), [donnéesTerritoiresAgrégées, préparerDonnéesCartographieÀPartirDUneListe]);

  return (
    <>
      <Titre
        baliseHtml='h2'
        className='fr-h6'
      >
        Répartition géographique
      </Titre>
      <CartographieTauxAvancement
        données={donnéesCartographie}
        niveauDeMaille={mailleSélectionnée}
        options={{ territoireSélectionnable: true }}
      />
    </>
  );
}
