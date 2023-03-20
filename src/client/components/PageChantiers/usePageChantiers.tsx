import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { actions as actionsFiltresStore, filtresActifs as filtresActifsStore } from '@/stores/useFiltresStore/useFiltresStore';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import { comparerAvancementChantier } from '@/client/utils/chantier/avancement/avancement';
import ListeChantiersMétéo from '@/components/PageChantiers/ListeChantiersTableau/Météo/ListeChantiersMétéo';
import ListeChantiersAvancement from '@/components/PageChantiers/ListeChantiersTableau/Avancement/ListeChantiersAvancement';
import { DonnéesTableauChantiers } from './ListeChantiersTableau/ListeChantiersTableau.interface';

const reactTableColonnesHelper = createColumnHelper<DonnéesTableauChantiers>();

function déterminerTypologieDuGroupementParMinistère(chantiersDuGroupe: DonnéesTableauChantiers[]) {
  return chantiersDuGroupe.some(chantier => chantier.estBaromètre);
}

const colonnesListeChantiers = [
  reactTableColonnesHelper.accessor('porteur', {
    header: 'Porteur',
    cell: porteur => porteur.getValue(),
    enableGrouping: true,
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
    aggregatedCell: nom => nom.row.original.porteur,
    enableSorting: false,
    enableGrouping: false,
  }),
  reactTableColonnesHelper.accessor('estBaromètre', {
    header: 'Typologie',
    enableSorting: false,
    cell: estBarometre => estBarometre.getValue() ? <PictoBaromètre taille={{ mesure: 1.25, unité: 'rem' }} /> : null,
    enableGrouping: false,
    aggregationFn: (_columnId, leafRows) => déterminerTypologieDuGroupementParMinistère(leafRows.map(row => row.original)),
    aggregatedCell: estBarometre => estBarometre.getValue() ? <PictoBaromètre taille={{ mesure: 1.25, unité: 'rem' }} /> : null,
  }),
  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    cell: météo => <ListeChantiersMétéo météo={météo.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerMétéo(a.getValue(columnId), b.getValue(columnId)),
    enableGrouping: false,
  }),
  reactTableColonnesHelper.accessor('avancement', {
    header: 'Avancement',
    cell: avancement => <ListeChantiersAvancement avancement={avancement.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerAvancementChantier(a.getValue(columnId), b.getValue(columnId)),
    enableGrouping: false,
    aggregationFn: 'mean',
    aggregatedCell: avancement => <ListeChantiersAvancement avancement={avancement.getValue() ?? null} />,
  }),
];

export default function usePageChantiers(chantiers: Chantier[]) {
  const filtresActifs = filtresActifsStore();
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();
  const maille = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const chantiersFiltrés = useMemo(() => {
    let résultat: Chantier[] = chantiers;

    if (filtresActifs.périmètresMinistériels.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.périmètresMinistériels.some(filtre => (chantier.périmètreIds.includes(filtre.id)))
      ));
    }
    if (filtresActifs.axes.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.axes.some(filtre => (chantier.axe === filtre.nom))
      ));
    }
    if (filtresActifs.ppg.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.ppg.some(filtre => (chantier.ppg === filtre.nom))
      ));
    }
    if (filtresActifs.autresFiltres.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.autresFiltres.some(filtre => (chantier[filtre.attribut as keyof Chantier]))
      ));
    }
    return résultat;
  }, [chantiers, filtresActifs]);

  const donnéesTerritoiresAgrégées = useMemo(() => {
    return new AgrégateurChantiersParTerritoire(chantiersFiltrés).agréger();
  }, [chantiersFiltrés]);

  const avancements = {
    moyenne: donnéesTerritoiresAgrégées[mailleAssociéeAuTerritoireSélectionné].territoires[territoireSélectionné.codeInsee].répartition.avancements.moyenne,
    médiane: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.médiane,
    minimum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.minimum,
    maximum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.maximum,
  };

  const météos = donnéesTerritoiresAgrégées[mailleAssociéeAuTerritoireSélectionné].territoires[territoireSélectionné.codeInsee].répartition.météos;

  const donnéesCartographie = useMemo(() => {
    return objectEntries(donnéesTerritoiresAgrégées[mailleSélectionnée].territoires).map(([codeInsee, territoire]) => ({
      valeur: territoire.répartition.avancements.moyenne,
      codeInsee: codeInsee,
    }));
  }, [donnéesTerritoiresAgrégées, mailleSélectionnée]);

  const donnéesListeChantiers = chantiersFiltrés.map(chantier => ({
    id: chantier.id,
    nom: chantier.nom,
    avancement: chantier.mailles[maille][territoireSélectionné.codeInsee].avancement.global,
    météo: chantier.mailles[maille][territoireSélectionné.codeInsee].météo,
    estBaromètre: chantier.estBaromètre,
    estTerritorialisé: chantier.estTerritorialisé,
    porteur: chantier.responsables.porteur,
  }));

  return {
    nombreFiltresActifs: récupérerNombreFiltresActifs(),
    chantiersFiltrés,
    avancements,
    météos,
    donnéesCartographie,
    donnéesListeChantiers,
    colonnesListeChantiers,
  };
}
