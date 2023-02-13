import { useEffect, useMemo } from 'react';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import régions from '@/client/constants/régions';
import départements from '@/client/constants/départements';
import SélecteurDeTerritoireProps from '@/components/_commons/SélecteurDeTerritoire/SélecteurDeTerritoire.interface';

// TODO supprimer et faire passer en serverSideProps
export const territoires = {
  nationale: [
    {
      codeInsee: 'FR',
      nom: 'France',
    },
  ],
  régionale: [
    ...régions,
  ],
  départementale: [
    ...départements,
  ],
};

export default function SélecteurDeTerritoire({ territoire, setTerritoire, maille }: SélecteurDeTerritoireProps) {
  useEffect(() => {
    setTerritoire({ codeInsee: territoires[maille][0].codeInsee, maille: maille });
  }, [setTerritoire, maille]);

  const options = useMemo(() => (
    territoires[maille].map(territoireÉlément => ({
      libellé: maille === 'départementale'
        ? `${territoireÉlément.codeInsee} – ${territoireÉlément.nom}`
        : territoireÉlément.nom,
      valeur: territoireÉlément.codeInsee,
    }))
  ), [maille]);

  const valeurSélecteur = useMemo(() => {
    if (!territoire || maille !== territoire.maille)
      return null;
    return territoire.codeInsee;
  }, [territoire, maille]);

  return (
    <Sélecteur
      htmlName="territoire"
      libellé='Territoire'
      options={options}
      setValeur={(valeur) => {
        setTerritoire({
          codeInsee: valeur,
          maille,
        });
      }}
      texteFantôme='Sélectionner un territoire'
      valeur={valeurSélecteur}
    />
  );
}
