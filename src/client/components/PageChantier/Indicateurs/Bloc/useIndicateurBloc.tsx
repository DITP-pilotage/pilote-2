import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import {
  territoiresComparésTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { DétailsIndicateurCodeInsee } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { estVueMobileStore } from '@/stores/useEstVueMobileStore/useEstVueMobileStore';
import IndicateurBlocIndicateurTuile from '@/components/PageChantier/Indicateurs/Bloc/indicateurBlocIndicateurTuile';
import { IndicateurDétailsParTerritoire } from './IndicateurBloc.interface';
import ValeurEtDate from './ValeurEtDate/ValeurEtDate';

const indicateurDétailsVide = {
  territoireNom: '',
  données: {
    codeInsee: '',
    valeurInitiale: null,
    dateValeurInitiale: null,
    valeurs: [],
    dateValeurs: [],
    valeurCible: null,
    dateValeurCible: null,
    avancement: { annuel: null, global: null },
  },
};

const reactTableColonnesHelper = createColumnHelper<IndicateurDétailsParTerritoire>();

export default function useIndicateurs(détailsIndicateur: DétailsIndicateurCodeInsee) {
  const estVueMobile = estVueMobileStore();
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
        setIndicateurDétailsParTerritoires([{ territoireNom: territoireSélectionné!.nomAffiché, données: détailsIndicateur[territoireSélectionné!.codeInsee] }]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [détailsIndicateur]);

  const colonnes = [
    reactTableColonnesHelper.accessor( 'territoireNom', {
      header: 'Territoire(s)',
      id: 'territoire',
      cell: nomDuTerritoire => nomDuTerritoire.getValue(),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.valeurInitiale', {
      header: 'Valeur initiale',
      id: 'valeurInitiale',
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
      id: 'valeurActuelle',
      cell: valeurs => (
        <ValeurEtDate
          date={valeurs.row.original.données.dateValeurs[valeurs.getValue().length - 1]}
          valeur={valeurs.getValue()[valeurs.getValue().length - 1]}
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.valeurCible', {
      header: 'Cible 2026',
      id: 'cible2026',
      cell: valeurCible => (
        <ValeurEtDate
          date={valeurCible.row.original.données.dateValeurCible}
          valeur={valeurCible.getValue()}
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.avancement.global', {
      header: 'Avancement 2026',
      id: 'avancement2026',
      cell: avancementGlobal => (
        <BarreDeProgression
          afficherTexte
          fond='grisClair'
          positionTexte='dessus'
          taille='md'
          valeur={avancementGlobal.getValue()}
          variante='primaire'
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.display({
      id: 'indicateur-tuile',
      cell: indicateurCellContext => <IndicateurBlocIndicateurTuile indicateurDétailsParTerritoire={indicateurCellContext.row.original} />,
      enableSorting: false,
      enableGrouping: false,
    }),
  ];

  const tableau = useReactTable({
    data: indicateurDétailsParTerritoires,
    columns: colonnes,
    state: {
      columnVisibility: estVueMobile ? ({
        territoire: false,
        valeurInitiale: false,
        valeurActuelle: false,
        cible2026: false,
        avancement2026: false,
      }) : ({
        'indicateur-tuile': false,
      }),
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return {
    indicateurDétailsParTerritoires,
    tableau,
  };
}
