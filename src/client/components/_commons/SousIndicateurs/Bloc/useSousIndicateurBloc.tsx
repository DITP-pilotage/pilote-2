import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useCallback, useEffect, useState } from 'react';
import {
  territoiresComparésTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import IndicateurBlocIndicateurTuile
  from '@/components/_commons/IndicateursChantier/Bloc/indicateurBlocIndicateurTuile';
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { formaterDate } from '@/client/utils/date/date';
import {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface';
import ValeurEtDate from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate';

const indicateurDétailsVide: IndicateurDétailsParTerritoire = {
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
    valeurCibleAnnuelle: null,
    dateValeurCibleAnnuelle: null,
    avancement: { global: null, annuel: null },
    proposition: null,
    unité: null,
    est_applicable: false,
    dateImport: null,
    pondération: null,
    prochaineDateMaj: null,
    prochaineDateMajJours: null,
    prochaineDateValeurActuelle: null,
    estAJour: null,
    tendance: null,
  },
};

const reactTableColonnesHelper = createColumnHelper<IndicateurDétailsParTerritoire>();

export default function useSousIndicateurBloc(détailsIndicateur: DétailsIndicateurTerritoire) {
  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue('sm');
  const territoiresComparés = territoiresComparésTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const [indicateurDétailsParTerritoires, setIndicateurDétailsParTerritoires] = useState<IndicateurDétailsParTerritoire[]>([indicateurDétailsVide]);

  const metÀJourDétailsParTerritoires = useCallback(() => {
    if (territoiresComparés.length > 0) {
      setIndicateurDétailsParTerritoires(
        territoiresComparés
          .map(t => ({ territoireNom: t.nomAffiché, données: détailsIndicateur[t.codeInsee] }))
          .sort((indicateurDétailsTerritoire1, indicateurDétailsTerritoire2) => indicateurDétailsTerritoire1.données.codeInsee.localeCompare(indicateurDétailsTerritoire2.données.codeInsee)),
      );
    } else {
      setIndicateurDétailsParTerritoires([{
        territoireNom: territoireSélectionné!.nomAffiché,
        données: détailsIndicateur[territoireSélectionné!.codeInsee],
      }]);
    }
  }, [détailsIndicateur, territoireSélectionné, territoiresComparés]);

  useEffect(() => {
    if (détailsIndicateur) {
      metÀJourDétailsParTerritoires();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [détailsIndicateur]);

  useEffect(() => {
    if (territoiresComparés.length === 0) {
      setIndicateurDétailsParTerritoires([indicateurDétailsVide]);
    }
  }, [territoiresComparés]);

  const colonnes = [
    reactTableColonnesHelper.accessor('territoireNom', {
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
          unité={valeurInitiale.row.original.données.unité}
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
          unité={valeurActuelle.row.original.données.unité}
          valeur={valeurActuelle.getValue()}
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.valeurCibleAnnuelle', {
      header: 'Cible ' + new Date().getFullYear().toString(),
      id: 'cibleAnnuelle',
      cell: valeurCibleAnnuelle => (
        <ValeurEtDate
          date={valeurCibleAnnuelle.row.original.données.dateValeurCibleAnnuelle}
          unité={valeurCibleAnnuelle.row.original.données.unité}
          valeur={valeurCibleAnnuelle.getValue()}
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.avancement.annuel', {
      header: 'Avancement ' + new Date().getFullYear().toString(),
      id: 'avancementAnnuel',
      cell: avancementAnnuel => (
        <BarreDeProgression
          afficherTexte
          fond='gris-clair'
          positionTexte='dessus'
          taille='md'
          valeur={avancementAnnuel.getValue()}
          variante='secondaire'
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
          unité={valeurCible.row.original.données.unité}
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
          fond='gris-clair'
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
          unité={indicateurCellContext.row.original.données.unité}
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
        cibleAnnuelle: false,
        avancementAnnuel: false,
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

  const dateDeMiseAJourIndicateur = territoireSélectionné
    ? formaterDate(détailsIndicateur[territoireSélectionné.codeInsee]?.dateImport, 'DD/MM/YYYY') ?? null
    : null;

  const dateProchaineDateMaj = territoireSélectionné
    ? formaterDate(détailsIndicateur[territoireSélectionné.codeInsee]?.prochaineDateMaj, 'DD/MM/YYYY') ?? null
    : null;

  const dateProchaineDateValeurActuelle = territoireSélectionné
    ? formaterDate(détailsIndicateur[territoireSélectionné.codeInsee]?.prochaineDateValeurActuelle, 'DD/MM/YYYY') ?? null
    : null;

  const dateValeurActuelle = territoireSélectionné
    ? formaterDate(détailsIndicateur[territoireSélectionné.codeInsee]?.dateValeurActuelle, 'DD/MM/YYYY') ?? null
    : null;

  return {
    indicateurDétailsParTerritoires,
    tableau,
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    dateProchaineDateValeurActuelle,
    dateValeurActuelle,
  };
}
