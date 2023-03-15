import Link from 'next/link';
import { createColumnHelper } from '@tanstack/react-table';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import { comparerAvancementChantier } from '@/client/utils/chantier/avancement/avancement';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import météos from '@/client/constants/météos';
import Avancement from '@/server/domain/avancement/Avancement.interface';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { DonnéesTableauChantiers } from '@/components/PageChantiers/ListeChantiers/ListeChantiers.interface';

export default function useListeChantiers() {

  const reactTableColonnesHelper = createColumnHelper<DonnéesTableauChantiers>();
  const taillePicto = { mesure: 1.25, unité: 'rem' } as const;

  function afficherMétéo(météo: Météo) {
    return météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE'
      ? <PictoMétéo valeur={météo} />
      : (
        <span className="texte-gris fr-text--xs">
          {météos[météo]}
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
      cell: météo => afficherMétéo(météo.getValue()),
      enableGlobalFilter: false,
      sortingFn: (a, b, columnId) => comparerMétéo(a.getValue(columnId), b.getValue(columnId)),
    }),
    reactTableColonnesHelper.accessor('avancement', {
      header: 'Avancement',
      cell: avancement => afficherLaBarreDeProgression(avancement.getValue()),
      enableGlobalFilter: false,
      sortingFn: (a, b, columnId) => comparerAvancementChantier(a.getValue(columnId), b.getValue(columnId)),
    }),
  ];

  return {
    colonnes,
  };
}
