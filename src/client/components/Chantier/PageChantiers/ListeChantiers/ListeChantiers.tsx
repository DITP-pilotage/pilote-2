import Image from 'next/image';
import { createColumnHelper } from '@tanstack/react-table';
import { ChantierAvancement } from '@/server/domain/chantier/chantierAvancement.interface';
import Tableau from '@/components/_commons/Tableau/Tableau';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import météos from '@/client/utils/météos';
import ListeChantiersProps from './ListeChantiers.interface';
import styles from './ListeChantiers.module.scss';

function mettreEnFormeLaMétéo(valeur: 1 | 2 | 3 | 4 | null) {
  if (valeur === null) {
    return (
      <span>
        Non renseigné
      </span>
    );
  }
  
  return (
    <Image
      alt={météos[valeur].nom}
      src={météos[valeur].picto}
    />
  );
}

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

const reactTableColonnesHelper = createColumnHelper<ListeChantiersProps['chantiers'][number]>();

const colonnes = [
  reactTableColonnesHelper.accessor('nom', {
    header: 'Chantiers',
    cell: nomChantier => nomChantier.getValue(),
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
    <div className={styles.conteneur}>
      <Tableau<typeof chantiers[number]>
        colonnes={colonnes}
        données={chantiers}
        entité="chantiers"
        titre="Liste des chantiers"
      />
    </div>
  );
}
