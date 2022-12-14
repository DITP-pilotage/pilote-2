import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import ChantierAvancement from '@/server/domain/chantier/ChantierAvancement.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Tableau from '@/components/_commons/Tableau/Tableau';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { mettreEnFormeLaMétéo } from '@/client/utils/météos';
import ListeChantiersProps from './ListeChantiers.interface';

function afficherLesBarresDeProgression(avancement: ChantierAvancement) {
  return (
    <>
      <BarreDeProgression
        fond="blanc"
        taille="petite"
        valeur={avancement.annuel}
        variante='secondaire'
      />
      <BarreDeProgression
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

const lienVersChantier = (chantier: Partial<Chantier>) => {
  return (
    <Link href={`/chantier/${chantier.id}`}>
      {chantier.nom}
    </Link>
  );
};

const reactTableColonnesHelper = createColumnHelper<ListeChantiersProps['chantiers'][number]>();

const colonnes = [
  reactTableColonnesHelper.accessor(chantier => chantier, {
    header: 'Chantiers',
    cell: chantier => lienVersChantier(chantier.getValue()),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    cell: météo => mettreEnFormeLaMétéo(météo.getValue()),
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
