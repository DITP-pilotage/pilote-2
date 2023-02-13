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
  niveauDeMaille,
  périmètreGéographique,
  setPérimètreGéographique,
}: SélecteurDePérimètreGéographiqueProps) {

  useEffect(() => {
    setPérimètreGéographique({
      codeInsee: 'FR',
      maille: 'nationale',
    });
  }, [niveauDeMaille, setPérimètreGéographique]);

  const options = [
    {
      libellé: 'France',
      valeur: 'FR',
    },
    ...périmètresGéographiques[niveauDeMaille]
      .map(territoire => ({
        libellé: niveauDeMaille === 'départementale'
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
          maille: codeInsee === 'FR' ? 'nationale' : niveauDeMaille,
        });
      }}
      valeur={périmètreGéographique.codeInsee}
    />
  );
}
