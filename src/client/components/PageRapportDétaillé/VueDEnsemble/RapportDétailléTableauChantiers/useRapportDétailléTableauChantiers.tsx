import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import { comparerAvancementRéforme } from '@/client/utils/chantier/avancement/avancement';
import TableauRéformesAvancement from '@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement';
import TypologiesPictos from '@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos';
import { DonnéesTableauChantiers } from '@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface';
import TableauRéformesMétéo from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo';
import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import RapportDétailléTableauChantiersProps from './RapportDétailléTableauChantiers.interface';

const reactTableColonnesHelper = createColumnHelper<DonnéesTableauChantiers>();

const colonnesTableauChantiers = [
  reactTableColonnesHelper.accessor('nom', {
    header: 'Chantiers',
    id: 'nom',
    cell: cellContext => (
      <IcônesMultiplesEtTexte
        icônesId={cellContext.row.original.porteur?.icône ? [cellContext.row.original.porteur.icône] : []}
      >
        {cellContext.getValue()}
      </IcônesMultiplesEtTexte>
    ),
    enableSorting: false,
    meta: {
      width: 'auto',
    },
  }),

  reactTableColonnesHelper.accessor('typologie', {
    header: 'Typologie',
    id: 'typologie',
    enableSorting: false,
    cell: cellContext => <TypologiesPictos typologies={cellContext.getValue()} />,
    meta: {
      width: '8rem',
    },
  }),

  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    id: 'météo',
    cell: cellContext => <TableauRéformesMétéo météo={cellContext.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerMétéo(a.getValue(columnId), b.getValue(columnId)),
    meta: {
      width: '10rem',
    },
  }),

  reactTableColonnesHelper.accessor('avancement', {
    header: 'Avancement',
    id: 'avancement',
    cell: cellContext => <TableauRéformesAvancement avancement={cellContext.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerAvancementRéforme(a.getValue(columnId), b.getValue(columnId)),
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
