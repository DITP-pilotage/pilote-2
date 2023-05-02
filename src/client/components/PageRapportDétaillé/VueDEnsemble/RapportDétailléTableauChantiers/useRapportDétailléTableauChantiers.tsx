import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import { comparerAvancementChantier } from '@/client/utils/chantier/avancement/avancement';
import TableauChantiersAvancement from '@/components/PageChantiers/TableauChantiers/Avancement/TableauChantiersAvancement';
import TableauChantiersMétéo from '@/components/PageChantiers/TableauChantiers/Météo/TableauChantiersMétéo';
import { calculerMoyenne } from '@/client/utils/statistiques/statistiques';
import PictosTypologie from '@/components/PageChantiers/TableauChantiers/PictosTypologie/PictosTypologie';
import { DonnéesTableauChantiers } from '@/components/PageChantiers/TableauChantiers/TableauChantiers.interface';
import RapportDétailléTableauChantiersProps from './RapportDétailléTableauChantiers.interface';

const déterminerTypologieDuGroupementParMinistère = (chantiersDuGroupe: DonnéesTableauChantiers[]) => {
  return { 
    estBaromètre: chantiersDuGroupe.some(chantier => chantier.typologie.estBaromètre),
    estTerritorialisé: chantiersDuGroupe.some(chantier => chantier.typologie.estTerritorialisé),
  };
};

const reactTableColonnesHelper = createColumnHelper<DonnéesTableauChantiers>();

const colonnesTableauChantiers = [
  reactTableColonnesHelper.accessor('nom', {
    header: 'Chantiers',
    id: 'nom',
    aggregatedCell: aggregatedCellContext => aggregatedCellContext.row.original.porteur,
    enableSorting: false,
    enableGrouping: false,
    meta: {
      width: 'auto',
    },
  }),

  reactTableColonnesHelper.accessor('typologie', {
    header: 'Typologie',
    id: 'typologie',
    enableSorting: false,
    cell: typologie => <PictosTypologie typologie={typologie.getValue()} />,
    enableGrouping: false,
    aggregationFn: (_columnId, leafRows) => déterminerTypologieDuGroupementParMinistère(leafRows.map(row => row.original)),
    aggregatedCell: typologie => typologie.getValue() ? <PictosTypologie typologie={typologie.getValue()} /> : null,
    meta: {
      width: '8rem',
    },
  }),

  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    id: 'météo',
    cell: météo => <TableauChantiersMétéo météo={météo.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerMétéo(a.getValue(columnId), b.getValue(columnId)),
    enableGrouping: false,
    meta: {
      width: '10rem',
    },
  }),

  reactTableColonnesHelper.accessor('avancement', {
    header: 'Avancement',
    id: 'avancement',
    cell: avancement => <TableauChantiersAvancement avancement={avancement.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerAvancementChantier(a.getValue(columnId), b.getValue(columnId)),
    enableGrouping: false,
    aggregationFn: (_columnId, chantiersDuMinistèreRow) => {
      return calculerMoyenne(chantiersDuMinistèreRow.map(chantierRow => chantierRow.original.avancement));
    },
    aggregatedCell: avancement => <TableauChantiersAvancement avancement={avancement.getValue() ?? null} />,
    meta: {
      width: '11rem',
    },
  }),
];

export default function useRapportDétailléTableauChantiers(données: RapportDétailléTableauChantiersProps['données']) {

  const tableau = useReactTable({
    data: données,
    columns: colonnesTableauChantiers,
    getCoreRowModel: getCoreRowModel(),
  });

  return {
    tableau,
  };
}
