import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import { calculerMoyenne } from '@/client/utils/statistiques';
import préparerDonnéesCartographie from '@/client/utils/cartographie/préparerDonnéesCartographie';
import RépartitionGéographiqueProps from './RépartitionGéographique.interface';

export default function RépartitionGéographique({ chantiers }: RépartitionGéographiqueProps) {
  const donnéesCartographie = useMemo(() => (
    préparerDonnéesCartographie(
      chantiers.map(chantier => chantier.mailles),
      (territoiresAgrégés) => {
        const valeurs = territoiresAgrégés.avancement.map(avancement => avancement.global);
        const valeurBrute = calculerMoyenne(valeurs);
        return {
          brute: valeurBrute,
          affichée: valeurBrute ? `${valeurBrute.toFixed(0)}%` : 'Non renseigné',
        };
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
        territoireAffiché={{
          codeInsee: 'FR',
          divisionAdministrative: 'france',
        }}
      />
      <Cartographie
        données={donnéesCartographie}
        niveauDeMailleAffiché='régionale'
        territoireAffiché={{
          codeInsee: 'FR',
          divisionAdministrative: 'france',
        }}
      />
      <Cartographie
        données={donnéesCartographie}
        niveauDeMailleAffiché='départementale'
        territoireAffiché={{
          codeInsee: '84',
          divisionAdministrative: 'région',
        }}
      />
    </>
  );
}
