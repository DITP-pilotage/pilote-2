import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import Tableau from '@/components/_commons/Tableau/Tableau';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import { comparerAvancementChantier } from '@/client/utils/chantier/avancement/avancement';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import ListeChantiersStyled from '@/components/PageChantiers/ListeChantiers/ListeChantiers.styled';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import Avancement from '@/server/domain/avancement/Avancement.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import météos from '@/client/constants/météos';
import ListeChantiersProps, { DonnéesTableauChantiers } from './ListeChantiers.interface';

function afficherMétéo(météo: Météo) {
  return météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE'
    ? <PictoMétéo valeur={météo} />
    : (
      <span className="texte-gris fr-text--xs">
        { météos[météo] }
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

const reactTableColonnesHelper = createColumnHelper<DonnéesTableauChantiers>();

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
]);

export default function ListeChantiers({ chantiers }: ListeChantiersProps) {
  const maille = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const donnéesDuTableau = chantiers.map(chantier => ({
    id: chantier.id,
    nom: chantier.nom,
    avancement: chantier.mailles[maille][territoireSélectionné.codeInsee].avancement.global,
    météo: chantier.mailles[maille][territoireSélectionné.codeInsee].météo,
    estBaromètre: chantier.estBaromètre,
    estTerritorialisé: chantier.estTerritorialisé,
  }));

  return (
    <ListeChantiersStyled>
      <Tableau<DonnéesTableauChantiers>
        colonnes={colonnesChantiers()}
        données={donnéesDuTableau}
        entité="chantier"
        titre="Liste des chantiers"
      />
    </ListeChantiersStyled>
  );
}
