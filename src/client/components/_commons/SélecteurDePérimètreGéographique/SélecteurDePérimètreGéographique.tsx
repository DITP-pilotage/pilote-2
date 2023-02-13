import '@gouvfr/dsfr/dist/component/select/select.min.css';
import { useEffect } from 'react';
import SélecteurDePérimètreGéographiqueProps from '@/components/_commons/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';
import départements from '@/client/constants/départements';
import régions from '@/client/constants/régions';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';

// TODO supprimer et faire passer en serverSideProps
const périmètresGéographiques = {
  régionale: [
    ...régions,
  ],
  départementale: [
    ...départements,
  ],
};

export default function SélecteurDePérimètreGéographique({
  mailleInterne,
  périmètreGéographique,
  setPérimètreGéographique,
}: SélecteurDePérimètreGéographiqueProps) {

  useEffect(() => {
    setPérimètreGéographique({
      codeInsee: 'FR',
      maille: 'nationale',
    });
  }, [mailleInterne, setPérimètreGéographique]);

  const options = [
    {
      libellé: 'France',
      valeur: 'FR',
    },
    ...périmètresGéographiques[mailleInterne]
      .map(territoire => ({
        libellé: mailleInterne === 'départementale'
          ? `${territoire.codeInsee} – ${territoire.nom}`
          : territoire.nom,
        valeur: territoire.codeInsee,
      })),
  ];

  return (
    <Sélecteur
      htmlName="périmètre-géographique"
      libellé="Périmètre géographique"
      options={options}
      setValeur={(codeInsee) => {
        setPérimètreGéographique({
          codeInsee,
          maille: codeInsee === 'FR' ? 'nationale' : mailleInterne,
        });
      }}
      valeur={périmètreGéographique.codeInsee}
    />
  );
}
