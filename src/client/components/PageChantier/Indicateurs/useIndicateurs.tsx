import { createColumnHelper } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { territoiresComparésTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { DetailsIndicateur } from '@/server/domain/indicateur/DetailsIndicateur.interface';
import { IndicateurDétailsParTerritoire } from './Indicateurs.interface';
import ValeurEtDate from './Bloc/ValeurEtDate/ValeurEtDate';

export default function useIndicateurs(détailsIndicateur: Record<CodeInsee, DetailsIndicateur>) {
  const territoiresComparés = territoiresComparésTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const [indicateurDétailsParTerritoires, setIndicateurDétailsParTerritoires] = useState<IndicateurDétailsParTerritoire[] | null>(null);

  useEffect(() => {
    if (détailsIndicateur !== undefined) {
      if (territoiresComparés.length > 0) {
        setIndicateurDétailsParTerritoires(
          territoiresComparés.map(territoire => ({ territoire: territoire.nom, données: détailsIndicateur[territoire.codeInsee] })),
        );
      } else {
        setIndicateurDétailsParTerritoires([{ territoire: territoireSélectionné.nom, données: détailsIndicateur[territoireSélectionné.codeInsee] }]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [détailsIndicateur]);
  
  
  const reactTableColonnesHelper = createColumnHelper<IndicateurDétailsParTerritoire>();
  const colonnes = [
    reactTableColonnesHelper.accessor( 'territoire', {
      header: 'Territoire(s)',
      cell: nomDuTerritoire => nomDuTerritoire.getValue(),
      enableSorting: false,
    }),
    // reactTableColonnesHelper.accessor('données.valeurInitiale', {
    //   header: 'Valeur initiale',
    //   cell: valeurInitiale => (
    //     <ValeurEtDate
    //       date={valeurInitiale.row.original.données.dateValeurInitiale}
    //       valeur={valeurInitiale.getValue()}
    //     />
    //   ),
    //   enableSorting: false,
    // }),
    // reactTableColonnesHelper.accessor('données.valeurs', {
    //   header: 'Valeur actuelle',
    //   cell: valeurs => (
    //     <ValeurEtDate
    //       date={valeurs.row.original.données.dateValeurs[valeurs.getValue().length - 1]}
    //       valeur={valeurs.row.original.données.valeurs[valeurs.getValue().length - 1]}
    //     />
    //   ),
    //   enableSorting: false,
    // }),
    reactTableColonnesHelper.accessor('données.valeurCible', {
      header: 'Valeur cible',
      cell: valeurCible => ( <ValeurEtDate valeur={valeurCible.getValue()} /> ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.avancement.global', {
      header: 'Taux avancement global',
      cell: avancementGlobal => (
        <>
          {avancementGlobal.getValue() === null ? '- %' : `${avancementGlobal.getValue()!.toFixed(0)}%`}
          <BarreDeProgression
            afficherTexte={false}
            fond='bleu'
            taille='moyenne'
            valeur={avancementGlobal.getValue()}
            variante='primaire'
          />
        </>
      ),
      enableSorting: false, 
    }),
  ];

  return { 
    indicateurDétailsParTerritoires, 
    colonnes, 
  };
}
