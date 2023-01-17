import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import { calculerMoyenne } from '@/client/utils/statistiques';
import { préparerDonnéesCartographieÀPartirDUneListe } from '@/client/utils/cartographie/préparerDonnéesCartographie';
import CartographieTauxAvancement from '@/components/_commons/Cartographie/CartographieTauxAvancement/CartographieTauxAvancement';
import useNiveauDeMailleStore from '@/client/stores/useNiveauDeMailleStore/useNiveauDeMailleStore';
import RépartitionGéographiqueProps from './RépartitionGéographique.interface';

export default function RépartitionGéographique({ chantiers }: RépartitionGéographiqueProps) {
  const niveauDeMaille = useNiveauDeMailleStore((étatActuel) => étatActuel.niveauDeMaille);
  
  const donnéesCartographie = useMemo(() => (
    préparerDonnéesCartographieÀPartirDUneListe(
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
      <CartographieTauxAvancement
        données={donnéesCartographie}
        niveauDeMaille={niveauDeMaille}
        territoireSélectionnable
      />
    </>
  );
}
