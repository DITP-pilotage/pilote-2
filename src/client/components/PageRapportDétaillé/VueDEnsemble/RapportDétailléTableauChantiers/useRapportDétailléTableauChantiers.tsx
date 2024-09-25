import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { comparerAvancementRéforme } from '@/client/utils/chantier/avancement/avancement';
import TableauRéformesAvancement from '@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement';
import TableauRéformesMétéo from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo';
import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import TypologiesPictos
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos';
import {
  DonnéesTableauChantiers,
} from '@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface';
import TableauChantiersTendance
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/Tendance/TableauChantiersTendance';
import TableauChantiersÉcart from '@/components/PageAccueil/PageChantiers/TableauChantiers/Écart/TableauChantiersÉcart';
import RapportDétailléTableauChantiersProps from './RapportDétailléTableauChantiers.interface';

const reactTableColonnesHelper = createColumnHelper<DonnéesTableauChantiers>();

const colonnesTableauChantiers = [
  reactTableColonnesHelper.accessor('nom', {
    header: 'Politiques prioritaires',
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
      width: '6.5rem',
    },
  }),

  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    id: 'météo',
    cell: cellContext => (
      <TableauRéformesMétéo
        dateDeMàjDonnéesQualitatives={cellContext.row.original.dateDeMàjDonnéesQualitatives}
        météo={cellContext.getValue()}
      />),
    enableGlobalFilter: false,
    meta: {
      width: '8rem',
    },
  }),

  reactTableColonnesHelper.accessor('avancement', {
    header: 'Avancement',
    id: 'avancement',
    cell: cellContext => (
      <TableauRéformesAvancement
        avancement={cellContext.getValue()}
        dateDeMàjDonnéesQuantitatives={cellContext.row.original.dateDeMàjDonnéesQuantitatives}
      />),
    enableGlobalFilter: false,
    meta: {
      width: '11rem',
    },
  }),
  ...(process.env.NEXT_PUBLIC_FF_ALERTES === 'true' && process.env.NEXT_PUBLIC_FF_ALERTES_BAISSE === 'true' ? [
    reactTableColonnesHelper.accessor('tendance', {
      header: 'Tendance',
      id: 'tendance',
      enableSorting: false,
      cell: cellContext => (
        <TableauChantiersTendance tendance={cellContext.getValue()} />
      ),
      enableGrouping: false,
      meta: {
        width: '7.5rem',
      },
    }),
    reactTableColonnesHelper.accessor('écart', {
      header: 'Écart',
      id: 'écart',
      enableSorting: false,
      cell: cellContext => (
        <TableauChantiersÉcart écart={cellContext.getValue()} />
      ),
      enableGrouping: false,
      meta: {
        width: '5.5rem',
      },
    }),
  ] : []),
];

export default function useRapportDétailléTableauChantiers(données: RapportDétailléTableauChantiersProps['données']) {

  const tableau = useReactTable({
    data: données.sort((a, b) => comparerAvancementRéforme(a.avancement, b.avancement, [{ id: 'avancement', desc: false }])),
    columns: colonnesTableauChantiers,
    getCoreRowModel: getCoreRowModel(),
  });

  return {
    tableau,
  };
}
