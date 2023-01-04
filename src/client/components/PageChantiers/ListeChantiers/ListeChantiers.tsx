import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import Tableau from '@/components/_commons/Tableau/Tableau';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import BarreDeProgressionProps from '@/components/_commons/BarreDeProgression/BarreDeProgression.interface';
import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import { Avancement, Maille } from '@/server/domain/chantier/Chantier.interface';
import ListeChantiersProps from './ListeChantiers.interface';

function afficherLesBarresDeProgression(avancement: Avancement) {
  return (
    <>
      <BarreDeProgression
        afficherCurseurs={false}
        fond="blanc"
        taille="petite"
        valeur={avancement.annuel as BarreDeProgressionProps['valeur']}
        variante='secondaire'
      />
      <BarreDeProgression
        afficherCurseurs={false}
        fond="blanc"
        taille="petite"
        valeur={avancement.global as BarreDeProgressionProps['valeur']}
        variante='primaire'
      />
    </>
  );
}

function comparerAvancementChantier(a: number | null, b: number | null) {
  if (a === null && b === null)
    return 0;
  if (a === null)
    return -1;
  if (b === null)
    return 1;
  if (a < b)
    return 1;
  if (a > b)
    return -1;
  return 0;
}

const reactTableColonnesHelper = createColumnHelper<ListeChantiersProps['chantiers'][number]>();

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
  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    cell: météo => <PictoMétéo valeur={météo.getValue()} />,
    enableGlobalFilter: false,
  }),
  reactTableColonnesHelper.accessor('mailles.nationale', {
    header: 'Avancement',
    cell: avancement => afficherLesBarresDeProgression(avancement.getValue().FR.avancement),
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => {
      return comparerAvancementChantier(a.getValue<Maille>(columnId).FR.avancement.global, b.getValue<Maille>(columnId).FR.avancement.global);
    },
  }),
];

export default function ListeChantiers({ chantiers }: ListeChantiersProps) {
  return (
    <Tableau<typeof chantiers[number]>
      colonnes={colonnes}
      données={chantiers}
      entité="chantiers"
      titre="Liste des chantiers"
    />
  );
}
