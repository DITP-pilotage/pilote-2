import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
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
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';

const reactTableColonnesHelper = createColumnHelper<IndicateurDétailsParTerritoire>();

export default function useSousIndicateurBloc(détailsIndicateur: DétailsIndicateurTerritoire, territoireCode: string) {
  const { codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);
  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue('sm');
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const détailTerritoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);

  const indicateurDétailsParTerritoires = [{
    territoireNom: détailTerritoireSélectionné.nomAffiché,
    données: détailsIndicateur[détailTerritoireSélectionné.codeInsee],
  }];

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

  const dateDeMiseAJourIndicateur = détailTerritoireSélectionné
    ? formaterDate(détailsIndicateur[détailTerritoireSélectionné.codeInsee]?.dateImport, 'DD/MM/YYYY') ?? null
    : null;

  const dateProchaineDateMaj = détailTerritoireSélectionné
    ? formaterDate(détailsIndicateur[détailTerritoireSélectionné.codeInsee]?.prochaineDateMaj, 'DD/MM/YYYY') ?? null
    : null;

  const indicateurNonAJour = détailsIndicateur[codeInsee]?.estAJour === false && détailsIndicateur[codeInsee]?.prochaineDateMaj !== null;

  return {
    tableau,
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    indicateurNonAJour,
    indicateurDétailsParTerritoires,
  };
}
