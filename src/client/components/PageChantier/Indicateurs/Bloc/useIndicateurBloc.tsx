import { createColumnHelper } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { territoiresComparésTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import ValeurEtDate from './ValeurEtDate/ValeurEtDate';
import { IndicateurDétailsParTerritoire } from './IndicateurBloc.interface';

const indicateurDétailsVide = {
  territoireNom: '', 
  données: {  
    codeInsee: '',
    valeurInitiale: null,
    dateValeurInitiale: null,
    valeurs: [],
    dateValeurs: [],
    valeurCible: null,
    avancement: { annuel: null, global: null },
  },
};

const reactTableColonnesHelper = createColumnHelper<IndicateurDétailsParTerritoire>();

export default function useIndicateurs(détailsIndicateur: Record<CodeInsee, DétailsIndicateur>) {
  const territoiresComparés = territoiresComparésTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const [indicateurDétailsParTerritoires, setIndicateurDétailsParTerritoires] = useState<IndicateurDétailsParTerritoire[]>([indicateurDétailsVide]);

  useEffect(() => {
    if (territoiresComparés.length === 0) {
      setIndicateurDétailsParTerritoires([indicateurDétailsVide]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [territoiresComparés]);

  useEffect(() => {
    if (détailsIndicateur) {
      if (territoiresComparés.length > 0) {
        setIndicateurDétailsParTerritoires(
          territoiresComparés
            .map(territoire => ({ territoireNom: territoire.nom, données: détailsIndicateur[territoire.codeInsee] }))
            .sort((indicateurDétailsTerritoire1, indicateurDétailsTerritoire2) => indicateurDétailsTerritoire1.données.codeInsee.localeCompare(indicateurDétailsTerritoire2.données.codeInsee)),
        );
      } else {
        setIndicateurDétailsParTerritoires([{ territoireNom: territoireSélectionné.nom, données: détailsIndicateur[territoireSélectionné.codeInsee] }]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [détailsIndicateur]);
  
  const colonnes = [
    reactTableColonnesHelper.accessor( 'territoireNom', {
      header: 'Territoire(s)',
      cell: nomDuTerritoire => nomDuTerritoire.getValue(),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.valeurInitiale', {
      header: 'Valeur initiale',
      cell: valeurInitiale => (
        <ValeurEtDate
          date={valeurInitiale.row.original.données.dateValeurInitiale}
          valeur={valeurInitiale.getValue()}
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.valeurs', {
      header: 'Valeur actuelle',
      cell: valeurs => (
        <ValeurEtDate
          date={valeurs.row.original.données.dateValeurs[valeurs.getValue().length - 1]}
          valeur={valeurs.getValue()[valeurs.getValue().length - 1]}
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.valeurCible', {
      header: 'Valeur cible',
      cell: valeurCible => <ValeurEtDate valeur={valeurCible.getValue()} />,
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.avancement.global', {
      header: 'Taux avancement global',
      cell: avancementGlobal => (
        <BarreDeProgression
          afficherTexte
          fond='grisClair'
          positionTexte='dessus'
          taille='moyenne'
          valeur={avancementGlobal.getValue()}
          variante='primaire'
        />
      ),
      enableSorting: false, 
    }),
  ];

  return { 
    indicateurDétailsParTerritoires, 
    colonnes, 
  };
}
