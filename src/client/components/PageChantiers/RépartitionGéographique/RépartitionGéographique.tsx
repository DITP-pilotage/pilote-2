import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import { calculerMoyenne } from '@/client/utils/statistiques';
import { préparerDonnéesCartographieÀPartirDUneListe } from '@/client/utils/cartographie/préparerDonnéesCartographie';
import CartographieTauxAvancement from '@/components/_commons/Cartographie/CartographieTauxAvancement/CartographieTauxAvancement';
import { mailleInterne as mailleInterneStore } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import RépartitionGéographiqueProps from './RépartitionGéographique.interface';

export default function RépartitionGéographique({ donnéesTerritoiresAgrégées }: RépartitionGéographiqueProps) {
  const mailleInterne = mailleInterneStore();
  const donnéesCartographie = useMemo(() => (
    préparerDonnéesCartographieÀPartirDUneListe(
      donnéesTerritoiresAgrégées,
      (territoiresAgrégés) => {
        const valeurs = territoiresAgrégés.avancement.map(avancement => avancement.global);
        return calculerMoyenne(valeurs);
      },
    )
  ), [donnéesTerritoiresAgrégées]);

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
        mailleInterne={mailleInterne}
        options={{ territoireSélectionnable: true }}
      />
    </>
  );
}
