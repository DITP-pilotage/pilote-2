import '@gouvfr/dsfr/dist/component/select/select.min.css';
import { useContext, useEffect, useMemo } from 'react';
import SélecteurDePérimètreGéographiqueProps from '@/components/_commons/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import AppContext from '@/client/contexts/AppContext/AppContext';

export default function SélecteurDePérimètreGéographique({
  mailleInterne,
  périmètreGéographique,
  setPérimètreGéographique,
}: SélecteurDePérimètreGéographiqueProps) {
  const { départements, régions } = useContext(AppContext);

  const périmètresGéographiques = useMemo(() => ({
    régionale: [
      ...régions,
    ],
    départementale: [
      ...départements,
    ],
  }), [départements, régions]);

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
