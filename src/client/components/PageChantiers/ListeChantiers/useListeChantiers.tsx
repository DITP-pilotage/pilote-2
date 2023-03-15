import Link from 'next/link';
import { createColumnHelper } from '@tanstack/react-table';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import { comparerAvancementChantier } from '@/client/utils/chantier/avancement/avancement';
import { DonnéesTableauChantiers } from '@/components/PageChantiers/ListeChantiers/ListeChantiers.interface';
import ListeChantiersMétéo from '@/components/PageChantiers/ListeChantiers/Météo/ListeChantiersMétéo';
import ListeChantiersAvancement from '@/components/PageChantiers/ListeChantiers/Avancement/ListeChantiersAvancement';

export default function useListeChantiers() {

  const reactTableColonnesHelper = createColumnHelper<DonnéesTableauChantiers>();
  const taillePicto = { mesure: 1.25, unité: 'rem' } as const;

  const colonnes = [
    reactTableColonnesHelper.accessor('nom', {
      header: 'Chantiers',
      cell: nom => {
        const id = nom.row.original.id;
        return (
          <Link href={`/chantier/${id}`}>
            {nom.getValue()}
          </Link>
        );
      },
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('estBaromètre', {
      header: 'Typologie',
      enableSorting: false,
      cell: estBarometre => estBarometre.getValue() ? <PictoBaromètre taille={taillePicto} /> : null,
    }),
    reactTableColonnesHelper.accessor('météo', {
      header: 'Météo',
      cell: météo => <ListeChantiersMétéo météo={météo.getValue()} />,
      enableGlobalFilter: false,
      sortingFn: (a, b, columnId) => comparerMétéo(a.getValue(columnId), b.getValue(columnId)),
    }),
    reactTableColonnesHelper.accessor('avancement', {
      header: 'Avancement',
      cell: avancement => <ListeChantiersAvancement avancement={avancement.getValue()} />,
      enableGlobalFilter: false,
      sortingFn: (a, b, columnId) => comparerAvancementChantier(a.getValue(columnId), b.getValue(columnId)),
    }),
  ];

  return {
    colonnes,
  };
}
