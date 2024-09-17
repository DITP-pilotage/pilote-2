import {
  ColumnSort,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChangeEvent, useCallback } from 'react';
import { parseAsArrayOf, parseAsInteger, parseAsJson, parseAsString, useQueryState, useQueryStates } from 'nuqs';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { formaterDate } from '@/client/utils/date/date';
import api from '@/server/infrastructure/api/trpc/api';
import { filtresUtilisateursActifsStore } from '@/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore';
import { UtilisateurListeGestionContrat } from '@/server/app/contrats/UtilisateurListeGestionContrat';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

const reactTableColonnesHelper = createColumnHelper<UtilisateurListeGestionContrat>();
const colonnes = [
  reactTableColonnesHelper.accessor('email', {
    header: 'Adresse électronique',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('nom', {
    header: 'Nom',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('prénom', {
    header: 'Prénom',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('profil', {
    header: 'Profil',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('fonction', {
    header: 'Fonction',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor(row => `${formaterDate(row.dateModification, 'DD/MM/YYYY')} par ${row.auteurModification}`, {
    header: 'Dernière modification',
    cell: props => props.getValue(),
    sortingFn: (a, b) => {
      const dateA = new Date(a.original.dateModification);
      const dateB = new Date(b.original.dateModification);

      if (dateA.getTime() > dateB.getTime()) {
        return 1;
      }

      if (dateA.getTime() < dateB.getTime()) {
        return -1;
      }

      return 0;
    },
  }),
  reactTableColonnesHelper.accessor(row => row.listeNomsTerritoires.join(', '), {
    id: 'territoire',
    header: 'Territoire',
    cell: props => props.getValue(),
  }),
];

export default function useTableauPageAdminUtilisateurs() {
  const { data: session } = useSession();
  const filtresActifs = filtresUtilisateursActifsStore();

  const estAutoriseAVoirLaColonneTerritoire = [ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(session!.profil);

  const [pagination, setPagination] = useQueryStates({
    pageIndex: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(20),
  }, {
    history: 'push',
    shallow: false,
  });

  const ZodSchemaSorting = z.object(
    {
      id: z.string().regex(/email|nom|prénom|profil|fonction|Dernière modification/),
      desc: z.boolean(),
    },
  );

  const [sorting, setSorting] = useQueryState('sort', parseAsArrayOf<ColumnSort>(parseAsJson(ZodSchemaSorting.parse)).withDefault([]).withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));

  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useQueryState('q', parseAsString.withDefault('').withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
    throttleMs: 400,
  }));

  const {
    data: { count, utilisateurs } = { count: 0, utilisateurs: [] },
    isLoading: estEnChargement,
  } = api.utilisateur.récupérerUtilisateursFiltrésNew.useQuery({
    filtres: filtresActifs,
    pagination,
    sorting,
    valeurDeLaRecherche,
  });

  const changementDeLaRechercheCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPagination({
      pageIndex: 1,
    });
    setValeurDeLaRecherche(event.target.value);
  }, [setPagination, setValeurDeLaRecherche]);

  const tableau = useReactTable({
    data: utilisateurs,
    columns: colonnes,

    globalFilterFn: (ligne, colonneId, texteRecherché) => {
      const valeurCellule = ligne.getValue<ProjetStructurant>(colonneId);
      return valeurCellule !== null && rechercheUnTexteContenuDansUnContenant(texteRecherché, valeurCellule.toString());
    },
    state: {
      pagination,
      sorting,
      columnVisibility: {
        territoire: estAutoriseAVoirLaColonneTerritoire,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    pageCount: count % 10 === 0 ? Math.trunc(count / pagination.pageSize) : Math.trunc(count / pagination.pageSize) + 1,
    manualPagination: true,
  });

  return {
    nombreElementPage: count,
    tableau,
    estEnChargement,
    valeurDeLaRecherche,
    changementDeLaRechercheCallback,
  };
}
