import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import ChantierAvancement from '@/server/domain/chantier/ChantierAvancement.interface';
import Tableau from '@/components/_commons/Tableau/Tableau';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import ListeChantiersProps from './ListeChantiers.interface';

function afficherLesBarresDeProgression(avancement: ChantierAvancement) {
  return (
    <>
      <BarreDeProgression
        afficherLesCurseurs={false}
        fond="blanc"
        taille="petite"
        valeur={avancement.annuel}
        variante='secondaire'
      />
      <BarreDeProgression
        afficherLesCurseurs={false}
        fond="blanc"
        taille="petite"
        valeur={avancement.global}
        variante='primaire'
      />
    </>
  );
}

function comparerAvancementChantier(a: ChantierAvancement, b: ChantierAvancement) {
  if (a.global === b.global)
    return 0;
  if (a.global === null)
    return -1;
  if (b.global === null)
    return 1;
  if (a.global < b.global)
    return 1;
  if (a.global > b.global)
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
  reactTableColonnesHelper.accessor('avancement', {
    header: 'Avancement',
    cell: avancement => afficherLesBarresDeProgression(avancement.getValue()),
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => {
      return comparerAvancementChantier(a.getValue(columnId), b.getValue(columnId));
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
