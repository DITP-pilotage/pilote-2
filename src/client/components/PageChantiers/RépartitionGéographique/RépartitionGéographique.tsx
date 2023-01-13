import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import { calculerMoyenne } from '@/client/utils/statistiques';
import préparerDonnéesCartographie from '@/client/utils/cartographie/préparerDonnéesCartographie';
import {
  CartographieValeur,
} from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';
import nuancierPourcentage from '@/client/constants/nuanciers/nuancierPourcentage';
import CartographieLégende from '@/components/_commons/Cartographie/CartographieAffichage/Légende/CartographieLégende';
import RépartitionGéographiqueProps from './RépartitionGéographique.interface';

function couleurDeRemplissage(valeur: CartographieValeur) {
  return valeur
    ? nuancierPourcentage.find(({ seuil }) => seuil >= valeur)?.couleur || '#dedede'
    : '#dedede';
}

function formaterValeur(valeur: CartographieValeur) {
  return valeur ? `${valeur.toFixed(0)}%` : 'Non renseigné';
}

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
      <Cartographie
        données={donnéesCartographie}
        niveauDeMailleAffiché='départementale'
        options={{
          couleurDeRemplissage,
          formaterValeur,
        }}
        territoireAffiché={{
          codeInsee: 'FR',
          divisionAdministrative: 'france',
        }}
      >
        <CartographieLégende nuancier={nuancierPourcentage} />
      </Cartographie>
    </>
  );
}
