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
import {
  estLargeurDÉcranActuelleMoinsLargeQue,
} from '@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import IndicateurBlocIndicateurTuile from '@/components/_commons/Indicateurs/Bloc/indicateurBlocIndicateurTuile';
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
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
    valeurActuelle: null,
    dateValeurActuelle: null,
    valeurCible: null,
    dateValeurCible: null,
    avancement: { annuel: null, global: null },
  },
};

const reactTableColonnesHelper = createColumnHelper<IndicateurDétailsParTerritoire>();

export default function useIndicateurBloc(détailsIndicateur: DétailsIndicateurTerritoire, typeDeRéforme: TypeDeRéforme, territoireProjetStructurant?: ProjetStructurant['territoire']) {
  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue('sm');
  const territoiresComparés = territoiresComparésTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const [indicateurDétailsParTerritoires, setIndicateurDétailsParTerritoires] = useState<IndicateurDétailsParTerritoire[]>([indicateurDétailsVide]);

  const metÀJourDétailsParTerritoires = () => {
    if (typeDeRéforme === 'chantier') {
      if (territoiresComparés.length > 0) {
        setIndicateurDétailsParTerritoires(
          territoiresComparés
            .map(t => ({ territoireNom: t.nomAffiché, données: détailsIndicateur[t.codeInsee] }))
            .sort((indicateurDétailsTerritoire1, indicateurDétailsTerritoire2) => indicateurDétailsTerritoire1.données.codeInsee.localeCompare(indicateurDétailsTerritoire2.données.codeInsee)),
        );
      } else {
        setIndicateurDétailsParTerritoires([{ territoireNom: territoireSélectionné!.nomAffiché, données: détailsIndicateur[territoireSélectionné!.codeInsee] }]);
      }
    } else if (typeDeRéforme === 'projet structurant' && territoireProjetStructurant) {
      setIndicateurDétailsParTerritoires([{ territoireNom: territoireProjetStructurant.nomAffiché, données: détailsIndicateur[territoireProjetStructurant.codeInsee] }]);
    }
  };
  
  useEffect(() => {
    if (détailsIndicateur) {
      metÀJourDétailsParTerritoires();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [détailsIndicateur, typeDeRéforme]);

  useEffect(() => {
    if (territoiresComparés.length === 0 && typeDeRéforme == 'chantier') {
      setIndicateurDétailsParTerritoires([indicateurDétailsVide]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [territoiresComparés]);  
    
  const colonnes = typeDeRéforme === 'chantier' ? [
    reactTableColonnesHelper.accessor( 'territoireNom', {
      header: 'Territoire(s)',
      id: 'territoire',
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
    reactTableColonnesHelper.accessor('données.valeurActuelle', {
      header: 'Valeur actuelle',
      id: 'valeurActuelle',
      cell: valeurActuelle => (
        <ValeurEtDate
          date={valeurActuelle.row.original.données.dateValeurActuelle}
          valeur={valeurActuelle.getValue()}
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.valeurCible', {
      header: 'Cible 2026',
      id: 'cible',
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
      id: 'avancement',
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
      id: 'indicateurTuile',
      cell: indicateurCellContext => (
        <IndicateurBlocIndicateurTuile
          indicateurDétailsParTerritoire={indicateurCellContext.row.original}
          typeDeRéforme='chantier'
        />
      ),
      enableSorting: false,
      enableGrouping: false,
    }),
  ] : [
    reactTableColonnesHelper.accessor( 'territoireNom', {
      header: 'Territoire',
      id: 'territoire',
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
    reactTableColonnesHelper.accessor('données.valeurActuelle', {
      header: 'Valeur actuelle',
      id: 'valeurActuelle',
      cell: valeurActuelle => (
        <ValeurEtDate
          date={valeurActuelle.row.original.données.dateValeurActuelle}
          valeur={valeurActuelle.getValue()}
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.valeurCible', {
      header: 'Cible',
      id: 'cible',
      cell: valeurCible => (
        <ValeurEtDate
          date={valeurCible.row.original.données.dateValeurCible}
          valeur={valeurCible.getValue()}
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.avancement.global', {
      header: 'Avancement',
      id: 'avancement',
      cell: avancementGlobal => (
        <BarreDeProgression
          afficherTexte
          fond='grisClair'
          positionTexte='dessus'
          taille='md'
          valeur={avancementGlobal.getValue()}
          variante='rose'
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.display({
      id: 'indicateurTuile',
      cell: indicateurCellContext => (
        <IndicateurBlocIndicateurTuile
          indicateurDétailsParTerritoire={indicateurCellContext.row.original}
          typeDeRéforme='projet structurant'
        />
      ),
      enableSorting: false,
      enableGrouping: false,
    }),
  ];

  const tableau = useReactTable({
    data: indicateurDétailsParTerritoires,
    columns: colonnes,
    state: {
      columnVisibility: estVueTuile ? ({
        territoire: false,
        valeurInitiale: false,
        valeurActuelle: false,
        cible: false,
        avancement: false,
      }) : ({
        indicateurTuile: false,
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
