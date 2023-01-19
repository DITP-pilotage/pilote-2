import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import Tableau from '@/components/_commons/Tableau/Tableau';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import BarreDeProgressionProps from '@/components/_commons/BarreDeProgression/BarreDeProgression.interface';
import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import { Avancement } from '@/server/domain/chantier/Chantier.interface';
import { comparerAvancementChantier } from '@/client/utils/chantier/avancement/avancement';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import {
  PérimètreGéographiqueIdentifiant,
} from '@/components/PageChantiers/BarreLatérale/SélecteursGéographiques/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';
import {
  périmètreGéographique as périmètreGéographiqueStore,
} from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import ListeChantiersProps from './ListeChantiers.interface';

function afficherLesBarresDeProgression(avancement: Avancement) {
  return (
    <>
      <BarreDeProgression
        fond="blanc"
        taille="petite"
        valeur={avancement.annuel as BarreDeProgressionProps['valeur']}
        variante='secondaire'
      />
      <BarreDeProgression
        fond="blanc"
        taille="petite"
        valeur={avancement.global as BarreDeProgressionProps['valeur']}
        variante='primaire'
      />
    </>
  );
}

const reactTableColonnesHelper = createColumnHelper<ListeChantiersProps['chantiers'][number]>();

function colonnesChantiers(périmètreGéographique: PérimètreGéographiqueIdentifiant) {
  const { codeInsee, maille } = périmètreGéographique;
  const cheminChantierMétéoDuTerritoire = `mailles.${maille}.${codeInsee}.météo` as const;
  const cheminChantierAvancementDuTerritoire = `mailles.${maille}.${codeInsee}.avancement` as const;
  return [
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
    reactTableColonnesHelper.accessor(cheminChantierMétéoDuTerritoire, {
      header: 'Météo',
      cell: météo => <PictoMétéo valeur={météo.getValue()} />,
      enableGlobalFilter: false,
      sortingFn: (a, b, columnId) => {
        return comparerMétéo(a.getValue(columnId), b.getValue(columnId));
      },
    }),
    reactTableColonnesHelper.accessor(cheminChantierAvancementDuTerritoire, {
      header: 'Avancement',
      cell: avancement => afficherLesBarresDeProgression(avancement.getValue()),
      enableGlobalFilter: false,
      sortingFn: (a, b, columnId) => {
        return comparerAvancementChantier(a.getValue<Avancement>(columnId).global, b.getValue<Avancement>(columnId).global);
      },
    }),
  ];
}

export default function ListeChantiers({ chantiers }: ListeChantiersProps) {
  const périmètreGéographique = périmètreGéographiqueStore();

  return (
    <Tableau<typeof chantiers[number]>
      colonnes={colonnesChantiers(périmètreGéographique)}
      données={chantiers}
      entité="chantiers"
      titre="Liste des chantiers"
    />
  );
}
