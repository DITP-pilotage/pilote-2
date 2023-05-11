import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import { comparerAvancementRéforme } from '@/client/utils/chantier/avancement/avancement';
import TableauRéformesAvancement from '@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement';
import { calculerMoyenne } from '@/client/utils/statistiques/statistiques';
import TypologiesPictos from '@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos';
import { DonnéesTableauChantiers } from '@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface';
import TableauRéformesMétéo from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo';
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
    cell: typologie => <TypologiesPictos typologies={typologie.getValue()} />,
    enableGrouping: false,
    aggregationFn: (_columnId, leafRows) => déterminerTypologieDuGroupementParMinistère(leafRows.map(row => row.original)),
    aggregatedCell: typologie => typologie.getValue() ? <TypologiesPictos typologies={typologie.getValue()} /> : null,
    meta: {
      width: '8rem',
    },
  }),

  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    id: 'météo',
    cell: météo => <TableauRéformesMétéo météo={météo.getValue()} />,
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
    cell: avancement => <TableauRéformesAvancement avancement={avancement.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerAvancementRéforme(a.getValue(columnId), b.getValue(columnId)),
    enableGrouping: false,
    aggregationFn: (_columnId, chantiersDuMinistèreRow) => {
      return calculerMoyenne(chantiersDuMinistèreRow.map(chantierRow => chantierRow.original.avancement));
    },
    aggregatedCell: avancement => <TableauRéformesAvancement avancement={avancement.getValue() ?? null} />,
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
