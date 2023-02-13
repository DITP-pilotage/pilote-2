import { useContext, useEffect, useMemo } from 'react';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import SélecteurDeTerritoireProps from '@/components/_commons/SélecteurDeTerritoire/SélecteurDeTerritoire.interface';
import AppContext from '@/client/contexts/AppContext/AppContext';

export default function SélecteurDeTerritoire({
  territoire,
  setTerritoire,
  maille,
}: SélecteurDeTerritoireProps) {
  const { départements, régions } = useContext(AppContext);

  const territoires = useMemo(() => ({
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
  }), [départements, régions]);

  useEffect(() => {
    if (maille === 'nationale') {
      setTerritoire({
        codeInsee: 'FR',
        maille: 'nationale',
      });
    } else {
      setTerritoire(null);
    }
  }, [setTerritoire, maille]);

  const options = useMemo(() => (
    territoires[maille].map(territoireÉlément => ({
      libellé: maille === 'départementale'
        ? `${territoireÉlément.codeInsee} – ${territoireÉlément.nom}`
        : territoireÉlément.nom,
      valeur: territoireÉlément.codeInsee,
    }))
  ), [maille]);

  const valeurSélecteur = useMemo(
    () => {
      if (!territoire || maille !== territoire.maille)
        return null;
      return territoire.codeInsee;
    },
    [territoire, maille],
  );

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
