import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import Tableau from '@/components/_commons/Tableau/Tableau';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { récupérerLibelléMétéo, PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import { Avancement } from '@/server/domain/chantier/Chantier.interface';
import { comparerAvancementChantier } from '@/client/utils/chantier/avancement/avancement';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import {
  PérimètreGéographiqueIdentifiant,
} from '@/components/_commons/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';
import {
  périmètreGéographique as périmètreGéographiqueStore,
} from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import { récupérerAvancement, récupérerMétéo } from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import ListeChantiersStyled from '@/components/PageChantiers/ListeChantiers/ListeChantiers.styled';
import Météo from '@/server/domain/chantier/Météo.interface';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import ListeChantiersProps from './ListeChantiers.interface';

function afficherMétéo(météo: Météo) {
  return météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE'
    ? <PictoMétéo valeur={météo} />
    : (
      <span className="texte-gris fr-text--xs">
        { récupérerLibelléMétéo(météo) }
      </span>
    );
}

function afficherLaBarreDeProgression(avancement: Avancement['global']) {
  return (
    avancement === null
      ? (
        <span className="texte-gris fr-text--xs">
          Non renseigné
        </span>
      ) : (
        <BarreDeProgression
          fond="gris"
          taille="petite"
          valeur={avancement}
          variante='primaire'
        />
      )
  );
}

const reactTableColonnesHelper = createColumnHelper<ListeChantiersProps['chantiersTerritorialisés'][number]>();

const taillePicto = { mesure: 1.25, unité: 'rem' } as const;

const colonnesChantiers = () => ([
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
    cell: estBarometre => estBarometre.getValue() === true
      ?
        <PictoBaromètre taille={taillePicto} />
      : null,
  }),
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
  reactTableColonnesHelper.accessor('météoTerritoire', {
    header: 'Météo',
    cell: météo => afficherMétéo(météo.getValue()),
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => {
      return comparerMétéo(a.getValue(columnId), b.getValue(columnId));
    },
  }),
  reactTableColonnesHelper.accessor('avancementGlobalTerritoire', {
    header: 'Avancement',
    cell: avancement => afficherLaBarreDeProgression(avancement.getValue()),
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => {
      return comparerAvancementChantier(a.getValue<Avancement>(columnId).global, b.getValue<Avancement>(columnId).global);
    },
  }),
]);

export default function ListeChantiers({ chantiersTerritorialisés }: ListeChantiersProps) {
  return (
    <ListeChantiersStyled>
      <Tableau<typeof chantiersTerritorialisés[number]>
        colonnes={colonnesChantiers()}
        données={chantiersTerritorialisés}
        entité="chantiers"
        titre="Liste des chantiers"
      />
    </ListeChantiersStyled>
  );
}
